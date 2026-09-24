import { useHttp } from '@inertiajs/react';
import { SendHorizontal, X } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { useInitials } from '@/hooks/use-initials';
import { formatFull, formatRelative } from '@/lib/relative-time';
import type { PostComment } from '@/types';

type CreatedComment = { comment: PostComment; comments_count: number };
type DeletedComment = { comments_count: number };

/** Comments update in place over JSON, so the feed never reloads for them. */
export function PostComments({
    postId,
    comments,
    commentsCount,
    onCountChange,
    inputRef,
}: {
    postId: number;
    comments: PostComment[];
    commentsCount: number;
    onCountChange: (count: number) => void;
    inputRef: RefObject<HTMLInputElement | null>;
}) {
    const getInitials = useInitials();
    const inputId = useId();
    const [thread, setThread] = useState(comments);
    const [expanded, setExpanded] = useState(false);
    const create = useHttp<{ body: string }, CreatedComment>({ body: '' });
    const remove = useHttp<Record<string, never>, DeletedComment>({});

    const visible = expanded ? thread : thread.slice(-2);
    const hiddenCount = commentsCount - visible.length;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (create.data.body.trim() === '') {
            return;
        }

        void create.post(`/posts/${postId}/comments`, {
            onSuccess: (response) => {
                setThread((current) => [...current, response.comment]);
                onCountChange(response.comments_count);
                create.reset('body');
            },
            onHttpException: () => {
                toast.error('Your comment was not posted. Try again.');
            },
        });
    }

    function destroy(comment: PostComment) {
        void remove.delete(`/comments/${comment.id}`, {
            onSuccess: (response) => {
                setThread((current) =>
                    current.filter((item) => item.id !== comment.id),
                );
                onCountChange(response.comments_count);
            },
            onHttpException: () => {
                toast.error('That comment could not be removed.');
            },
        });
    }

    return (
        <div className="border-t bg-muted/60 px-4 py-3 sm:px-5">
            {hiddenCount > 0 && (
                <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    disabled={expanded}
                    className="mb-2 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:no-underline"
                >
                    {expanded
                        ? `Showing the latest ${thread.length} comments`
                        : `View ${hiddenCount === 1 ? '1 more comment' : `${hiddenCount} more comments`}`}
                </button>
            )}

            {visible.length > 0 && (
                <ul className="mb-3 space-y-3">
                    {visible.map((comment) => (
                        <li key={comment.id} className="group flex gap-2.5">
                            <span
                                aria-hidden
                                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs text-muted-foreground"
                            >
                                {getInitials(comment.author.name)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm leading-snug">
                                    <span className="font-medium">
                                        {comment.author.name}
                                    </span>
                                    {comment.author.deactivated && (
                                        <span className="text-xs text-muted-foreground italic">
                                            {' '}
                                            (deactivated)
                                        </span>
                                    )}{' '}
                                    <span className="break-words whitespace-pre-line">
                                        {comment.body}
                                    </span>
                                </p>
                                <time
                                    dateTime={comment.created_at ?? undefined}
                                    title={formatFull(comment.created_at)}
                                    className="text-xs text-muted-foreground"
                                >
                                    {formatRelative(comment.created_at)}
                                </time>
                            </div>
                            {comment.can_delete && (
                                <button
                                    type="button"
                                    onClick={() => destroy(comment)}
                                    disabled={remove.processing}
                                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-100 outline-none hover:bg-background hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
                                >
                                    <X aria-hidden className="size-3.5" />
                                    <span className="sr-only">
                                        Delete comment by {comment.author.name}
                                    </span>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={submit} className="flex items-center gap-2">
                <label htmlFor={inputId} className="sr-only">
                    Write a comment
                </label>
                <input
                    id={inputId}
                    ref={inputRef}
                    value={create.data.body}
                    onChange={(event) =>
                        create.setData('body', event.target.value)
                    }
                    maxLength={1000}
                    placeholder="Write a comment…"
                    autoComplete="off"
                    aria-invalid={Boolean(create.errors.body)}
                    className="h-9 min-w-0 flex-1 rounded-[6px] border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring/60 focus-visible:ring-[3px] focus-visible:ring-ring/20"
                />
                <button
                    type="submit"
                    disabled={
                        create.processing || create.data.body.trim() === ''
                    }
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity duration-150 outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40"
                >
                    <SendHorizontal aria-hidden className="size-4" />
                    <span className="sr-only">Post comment</span>
                </button>
            </form>
            <InputError message={create.errors.body} className="mt-1.5 pl-4" />
        </div>
    );
}
