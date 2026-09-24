import { router, useForm, useHttp } from '@inertiajs/react';
import {
    Heart,
    MessageCircle,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { PostComments } from '@/components/hei/post-comments';
import { PostImages } from '@/components/hei/post-images';
import { SourceAvatar } from '@/components/hei/source-avatar';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatFull, formatRelative } from '@/lib/relative-time';
import { cn } from '@/lib/utils';
import type { Post } from '@/types';

const CHED_LABEL = 'CHED Regional Office XII';

type LikeState = { liked: boolean; likes_count: number };

export function PostCard({ post }: { post: Post }) {
    const source = post.hei?.display_name ?? CHED_LABEL;

    // Server data wins whenever the feed reloads; local state covers the
    // likes and comments made since.
    const [synced, setSynced] = useState(post);
    const [like, setLike] = useState<LikeState>({
        liked: post.liked,
        likes_count: post.likes_count,
    });
    const [commentsCount, setCommentsCount] = useState(post.comments_count);
    const [revision, setRevision] = useState(0);

    if (synced !== post) {
        setSynced(post);
        setLike({ liked: post.liked, likes_count: post.likes_count });
        setCommentsCount(post.comments_count);
        setRevision((value) => value + 1);
    }

    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [clamped, setClamped] = useState(false);
    const bodyRef = useRef<HTMLParagraphElement>(null);
    const commentInput = useRef<HTMLInputElement>(null);
    const likeRequest = useHttp<Record<string, never>, LikeState>({});
    const edit = useForm({ body: post.body ?? '' });

    useLayoutEffect(() => {
        const element = bodyRef.current;

        if (element && !expanded) {
            setClamped(element.scrollHeight > element.clientHeight + 1);
        }
    }, [post.body, expanded, editing]);

    function toggleLike() {
        const previous = like;
        const next = {
            liked: !like.liked,
            likes_count: like.likes_count + (like.liked ? -1 : 1),
        };
        setLike(next);

        const url = `/posts/${post.id}/like`;
        const options = {
            onSuccess: (response: LikeState) => setLike(response),
            onHttpException: () => {
                setLike(previous);
                toast.error('That did not go through. Try again.');
            },
            onNetworkError: () => {
                setLike(previous);
                toast.error('You appear to be offline.');
            },
        };

        void (previous.liked
            ? likeRequest.delete(url, options)
            : likeRequest.post(url, options));
    }

    function saveEdit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        edit.put(`/posts/${post.id}`, {
            preserveScroll: true,
            reset: ['posts'],
            onSuccess: () => setEditing(false),
        });
    }

    function deletePost() {
        router.delete(`/posts/${post.id}`, {
            preserveScroll: true,
            reset: ['posts'],
            onFinish: () => setConfirmDelete(false),
        });
    }

    return (
        <article
            aria-labelledby={`post-${post.id}-source`}
            className="overflow-hidden rounded-[10px] border bg-card"
        >
            <header className="flex items-start gap-3 px-4 pt-4 sm:px-5">
                <SourceAvatar name={source} official={!post.hei} />
                <div className="min-w-0 flex-1">
                    <p
                        id={`post-${post.id}-source`}
                        className="truncate text-sm font-medium"
                    >
                        {source}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {post.author.name}
                        {post.author.deactivated && (
                            <>
                                <span aria-hidden> · </span>
                                <span className="italic">
                                    Deactivated account
                                </span>
                            </>
                        )}
                        <span aria-hidden> · </span>
                        <time
                            dateTime={post.created_at ?? undefined}
                            title={formatFull(post.created_at)}
                        >
                            {formatRelative(post.created_at)}
                        </time>
                        {post.edited && (
                            <>
                                <span aria-hidden> · </span>Edited
                            </>
                        )}
                    </p>
                </div>
                {(post.can_edit || post.can_delete) && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="-mt-1 -mr-2 size-8 rounded-full text-muted-foreground"
                            >
                                <MoreHorizontal />
                                <span className="sr-only">Post options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {post.can_edit && (
                                <DropdownMenuItem
                                    onSelect={() => {
                                        edit.setData('body', post.body ?? '');
                                        edit.clearErrors();
                                        setEditing(true);
                                    }}
                                >
                                    <Pencil />
                                    Edit post
                                </DropdownMenuItem>
                            )}
                            {post.can_delete && (
                                <DropdownMenuItem
                                    onSelect={() => setConfirmDelete(true)}
                                    className="text-destructive focus:text-destructive [&_svg]:!text-destructive"
                                >
                                    <Trash2 />
                                    Delete post
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </header>

            {editing ? (
                <form onSubmit={saveEdit} className="px-4 pt-3 sm:px-5">
                    <label htmlFor={`post-${post.id}-edit`} className="sr-only">
                        Edit post
                    </label>
                    <textarea
                        id={`post-${post.id}-edit`}
                        value={edit.data.body}
                        onChange={(event) =>
                            edit.setData('body', event.target.value)
                        }
                        rows={4}
                        maxLength={5000}
                        autoFocus
                        className="w-full resize-y rounded-[6px] border bg-transparent px-3 py-2 text-[0.9375rem] leading-relaxed outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    />
                    <InputError message={edit.errors.body} className="mt-1" />
                    <div className="mt-2 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={edit.processing}
                        >
                            Save changes
                        </Button>
                    </div>
                </form>
            ) : (
                post.body && (
                    <div className="px-4 pt-3 sm:px-5">
                        <p
                            ref={bodyRef}
                            className={cn(
                                'text-[0.9375rem] leading-relaxed break-words whitespace-pre-line',
                                !expanded && 'line-clamp-5',
                            )}
                        >
                            {post.body}
                        </p>
                        {(clamped || expanded) && (
                            <button
                                type="button"
                                onClick={() => setExpanded((value) => !value)}
                                aria-expanded={expanded}
                                className="mt-1 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                {expanded ? 'Show less' : 'Show more'}
                            </button>
                        )}
                    </div>
                )
            )}

            {post.images.length > 0 && (
                <div className="px-4 pt-3 sm:px-5">
                    <PostImages images={post.images} sharedBy={source} />
                </div>
            )}

            <div className="mt-3 flex items-center gap-1 border-t px-2 py-1.5 sm:px-3">
                <button
                    type="button"
                    onClick={toggleLike}
                    aria-pressed={like.liked}
                    className={cn(
                        'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm tabular-nums transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        like.liked
                            ? 'text-signature-red'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <Heart
                        aria-hidden
                        className={cn(
                            'size-4 transition-transform duration-200 ease-out',
                            like.liked && 'scale-110 fill-current',
                        )}
                    />
                    <span>
                        {like.likes_count > 0 ? like.likes_count : 'Like'}
                    </span>
                    <span className="sr-only">
                        {like.likes_count > 0 &&
                            (like.likes_count === 1 ? ' like' : ' likes')}
                        {like.liked ? ', you liked this' : ''}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={() => commentInput.current?.focus()}
                    className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground tabular-nums transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <MessageCircle aria-hidden className="size-4" />
                    {commentsCount > 0 ? commentsCount : 'Comment'}
                    <span className="sr-only">
                        {commentsCount > 0 &&
                            (commentsCount === 1 ? ' comment' : ' comments')}
                    </span>
                </button>
            </div>

            <PostComments
                key={revision}
                postId={post.id}
                comments={post.comments}
                commentsCount={commentsCount}
                onCountChange={setCommentsCount}
                inputRef={commentInput}
            />

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this post?</DialogTitle>
                        <DialogDescription>
                            The post, its photos, likes, and comments will be
                            removed for everyone. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDelete(false)}
                        >
                            Keep post
                        </Button>
                        <Button variant="destructive" onClick={deletePost}>
                            Delete post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </article>
    );
}
