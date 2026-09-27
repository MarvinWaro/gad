import { useHttp, usePage } from '@inertiajs/react';
import { CornerDownRight, SendHorizontal } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import { toast } from '@/lib/toast';
import InputError from '@/components/input-error';
import { PersonAvatar } from '@/components/person-avatar';
import { formatFull, formatRelative } from '@/lib/relative-time';
import { cn } from '@/lib/utils';
import type { PostComment } from '@/types';

type CreatedComment = { comment: PostComment; comments_count: number };
type DeletedComment = { comments_count: number };

type ThreadHandlers = {
    postId: string;
    viewerName: string;
    onCreated: (comment: PostComment, count: number) => void;
    onDelete: (comment: PostComment, done?: () => void) => void;
    deleting: boolean;
};

/**
 * A post's comment threads, oldest first, like Facebook: replies sit one
 * level under their comment, folded behind "View N replies". Everything
 * updates in place over JSON; the post card owns the threads.
 */
export function CommentList({
    postId,
    comments,
    hasMore,
    viewerName,
    onCreated,
    onRemoved,
}: {
    postId: string;
    comments: PostComment[];
    hasMore: boolean;
    viewerName: string;
    onCreated: (comment: PostComment, count: number) => void;
    onRemoved: (commentId: number, count: number) => void;
}) {
    const remove = useHttp<Record<string, never>, DeletedComment>({});

    function destroy(comment: PostComment, done?: () => void) {
        void remove
            .delete(`/comments/${comment.id}`, {
                onSuccess: (response) =>
                    onRemoved(comment.id, response.comments_count),
                onHttpException: () => {
                    toast.error('That comment could not be removed.');
                },
            })
            .finally(() => done?.());
    }

    return (
        <>
            {hasMore && (
                <p className="mb-3 text-xs text-muted-foreground">
                    Showing the latest {comments.length} comments.
                </p>
            )}
            <ul className="space-y-4">
                {comments.map((comment) => (
                    <CommentThread
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        viewerName={viewerName}
                        onCreated={onCreated}
                        onDelete={destroy}
                        deleting={remove.processing}
                    />
                ))}
            </ul>
        </>
    );
}

/** One comment with its replies and, while replying, an inline reply box. */
function CommentThread({
    comment,
    ...handlers
}: ThreadHandlers & { comment: PostComment }) {
    const [expanded, setExpanded] = useState(false);
    const [replyingTo, setReplyingTo] = useState<PostComment | null>(null);
    const replyInput = useRef<HTMLTextAreaElement>(null);
    const replies = comment.replies;

    function startReply(target: PostComment) {
        setReplyingTo(target);
        setExpanded(true);
        // Same target again: keep the draft, just bring the cursor back.
        requestAnimationFrame(() => replyInput.current?.focus());
    }

    return (
        <li>
            <CommentItem
                comment={comment}
                onReply={() => startReply(comment)}
                onDelete={handlers.onDelete}
                deleting={handlers.deleting}
            />

            {(replies.length > 0 || replyingTo) && (
                <div className="mt-2.5 space-y-3 pl-[2.625rem]">
                    {replies.length > 0 && !expanded && (
                        <button
                            type="button"
                            onClick={() => setExpanded(true)}
                            aria-expanded={false}
                            className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <CornerDownRight aria-hidden className="size-4" />
                            View {replies.length}{' '}
                            {replies.length === 1 ? 'reply' : 'replies'}
                        </button>
                    )}

                    {expanded && replies.length > 0 && (
                        <ul
                            aria-label={`Replies to ${comment.author.name}`}
                            className="space-y-3"
                        >
                            {replies.map((reply) => (
                                <li key={reply.id}>
                                    <CommentItem
                                        comment={reply}
                                        compact
                                        onReply={() => startReply(reply)}
                                        onDelete={handlers.onDelete}
                                        deleting={handlers.deleting}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    {replyingTo && (
                        <CommentComposer
                            // A new target starts a fresh box, focused.
                            key={replyingTo.id}
                            postId={handlers.postId}
                            parentId={replyingTo.id}
                            authorName={handlers.viewerName}
                            placeholder={`Reply to ${replyingTo.author.name}`}
                            onCreated={handlers.onCreated}
                            inputRef={replyInput}
                            autoFocus
                            compact
                        />
                    )}
                </div>
            )}
        </li>
    );
}

function CommentItem({
    comment,
    compact = false,
    onReply,
    onDelete,
    deleting,
}: {
    comment: PostComment;
    compact?: boolean;
    onReply: () => void;
    onDelete: (comment: PostComment, done?: () => void) => void;
    deleting: boolean;
}) {
    return (
        <div className="flex gap-2.5">
            <PersonAvatar
                name={comment.author.name}
                src={comment.author.avatar}
                className={cn('mt-0.5', compact ? 'size-7' : 'size-8')}
            />
            <div className="min-w-0 flex-1">
                <div className="inline-block max-w-full rounded-[14px] bg-foreground/5 px-3 py-2">
                    <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
                        {comment.author.name}
                        {comment.is_post_author && (
                            <span className="rounded-full bg-brand-soft px-1.5 text-xs font-normal text-brand">
                                Author
                            </span>
                        )}
                        {comment.author.deactivated && (
                            <span className="text-xs font-normal text-muted-foreground italic">
                                (deactivated)
                            </span>
                        )}
                    </p>
                    <p className="text-sm leading-snug break-words whitespace-pre-line">
                        {comment.reply_to && (
                            <span className="font-medium text-brand">
                                {comment.reply_to.name}{' '}
                            </span>
                        )}
                        {comment.body}
                    </p>
                </div>
                <div className="mt-0.5 flex items-center gap-3 pl-3 text-xs text-muted-foreground">
                    <time
                        dateTime={comment.created_at ?? undefined}
                        title={formatFull(comment.created_at)}
                    >
                        {formatRelative(comment.created_at)}
                    </time>
                    <button
                        type="button"
                        onClick={onReply}
                        className="rounded-sm font-medium outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        Reply
                        <span className="sr-only">
                            {' '}
                            to {comment.author.name}
                        </span>
                    </button>
                    {comment.can_delete && (
                        <ConfirmPopover
                            title="Delete this comment?"
                            description={
                                comment.replies.length > 0
                                    ? 'Its replies are deleted with it. This cannot be undone.'
                                    : 'This cannot be undone.'
                            }
                            confirmLabel="Delete"
                            onConfirm={(visit) => {
                                visit.onStart();
                                onDelete(comment, visit.onFinish);
                            }}
                        >
                            <button
                                type="button"
                                disabled={deleting}
                                className="rounded-sm font-medium outline-none hover:text-destructive hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
                            >
                                Delete
                                <span className="sr-only">
                                    {' '}
                                    comment by {comment.author.name}
                                </span>
                            </button>
                        </ConfirmPopover>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * "Comment as …" or "Reply to …": a growing box that sends on Enter
 * (Shift+Enter for a new line) and hands the saved comment back.
 */
export function CommentComposer({
    postId,
    authorName,
    onCreated,
    inputRef,
    parentId,
    placeholder,
    autoFocus = false,
    compact = false,
}: {
    postId: string;
    authorName: string;
    onCreated: (comment: PostComment, count: number) => void;
    inputRef?: RefObject<HTMLTextAreaElement | null>;
    /** Answering this comment (or reply); the server keeps threads one deep. */
    parentId?: number;
    placeholder?: string;
    autoFocus?: boolean;
    compact?: boolean;
}) {
    const { auth } = usePage().props;
    const inputId = useId();
    const ownRef = useRef<HTMLTextAreaElement>(null);
    const textarea = inputRef ?? ownRef;
    const create = useHttp<
        { body: string; parent_id: number | null },
        CreatedComment
    >({ body: '', parent_id: parentId ?? null });

    function resize() {
        const element = textarea.current;

        if (element) {
            element.style.height = 'auto';
            element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
        }
    }

    function send() {
        if (create.data.body.trim() === '' || create.processing) {
            return;
        }

        void create.post(`/posts/${postId}/comments`, {
            onSuccess: (response) => {
                onCreated(response.comment, response.comments_count);
                create.reset('body');
                requestAnimationFrame(resize);
            },
            onHttpException: () => {
                toast.error('Your comment was not posted. Try again.');
            },
        });
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        send();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        // Enter sends, except mid-composition in an input method (IME).
        if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
        ) {
            event.preventDefault();
            send();
        }
    }

    const errors = [create.errors.body, create.errors.parent_id].filter(
        (message): message is string => Boolean(message),
    );

    return (
        <form onSubmit={submit} className="flex items-end gap-2.5">
            <PersonAvatar
                name={authorName}
                src={auth.user.avatar}
                className={cn('mb-0.5', compact ? 'size-7' : 'size-8')}
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-end gap-1 rounded-[18px] bg-foreground/5 py-1 pr-1 pl-3.5 transition-shadow duration-150 focus-within:ring-[3px] focus-within:ring-ring/20">
                    <label htmlFor={inputId} className="sr-only">
                        {placeholder ?? 'Write a comment'}
                    </label>
                    <textarea
                        id={inputId}
                        ref={textarea}
                        value={create.data.body}
                        onChange={(event) => {
                            create.setData('body', event.target.value);
                            resize();
                        }}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        maxLength={1000}
                        autoFocus={autoFocus}
                        placeholder={placeholder ?? `Comment as ${authorName}`}
                        aria-invalid={errors.length > 0}
                        className={cn(
                            'max-h-40 flex-1 resize-none bg-transparent py-2 leading-snug caret-brand outline-none placeholder:text-muted-foreground',
                            compact
                                ? 'min-h-8 text-sm'
                                : 'min-h-9 text-[0.9375rem]',
                        )}
                    />
                    <button
                        type="submit"
                        disabled={
                            create.processing || create.data.body.trim() === ''
                        }
                        className="flex size-8 shrink-0 items-center justify-center rounded-full text-brand transition-opacity duration-150 outline-none hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:text-muted-foreground disabled:opacity-60"
                    >
                        <SendHorizontal aria-hidden className="size-4" />
                        <span className="sr-only">
                            {parentId ? 'Post reply' : 'Post comment'}
                        </span>
                    </button>
                </div>
                {errors.map((message) => (
                    <InputError
                        key={message}
                        message={message}
                        className="mt-1.5 pl-3.5"
                    />
                ))}
            </div>
        </form>
    );
}
