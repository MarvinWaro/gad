import { router, useForm, useHttp, usePage } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from '@/lib/toast';
import { PostDialog } from '@/components/hei/post-dialog';
import { hasPostMedia, PostMedia } from '@/components/hei/post-goals';
import {
    PostActions,
    PostByline,
    SharedPostEmbed,
    sourceOf,
} from '@/components/hei/post-parts';
import type { LikeState } from '@/components/hei/post-parts';
import { SharePostDialog } from '@/components/hei/post-share-dialog';
import InputError from '@/components/input-error';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Post, PostComment } from '@/types';

export function PostCard({
    post,
    openOnArrival = false,
}: {
    post: Post;
    /** Open the post modal right away, as its own page does. */
    openOnArrival?: boolean;
}) {
    const { auth } = usePage().props;
    const source = sourceOf(post);

    // Server data wins whenever the feed reloads; local state covers the
    // likes and comments made since.
    const [synced, setSynced] = useState(post);
    const [like, setLike] = useState<LikeState>({
        liked: post.liked,
        likes_count: post.likes_count,
    });
    const [thread, setThread] = useState(post.comments);
    const [commentsCount, setCommentsCount] = useState(post.comments_count);

    if (synced !== post) {
        setSynced(post);
        setLike({ liked: post.liked, likes_count: post.likes_count });
        setThread(post.comments);
        setCommentsCount(post.comments_count);
    }

    const [editing, setEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    // Set when "Delete post" is picked. The confirmation opens only once the
    // menu has closed, so the closing menu cannot pull focus away from it.
    const deleteChosen = useRef(false);
    const [expanded, setExpanded] = useState(false);
    const [clamped, setClamped] = useState(false);
    const [commentsOpen, setCommentsOpen] = useState(openOnArrival);
    const [shareOpen, setShareOpen] = useState(false);
    const bodyRef = useRef<HTMLParagraphElement>(null);
    const composerRef = useRef<HTMLTextAreaElement>(null);
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

    function deletePost(visit: ConfirmVisit) {
        router.delete(`/posts/${post.id}`, {
            preserveScroll: true,
            reset: ['posts'],
            ...visit,
        });
    }

    // A new comment starts a thread; a reply joins its thread's replies.
    function addComment(comment: PostComment, count: number) {
        setThread((current) =>
            comment.parent_id === null
                ? [...current, comment]
                : current.map((thread) =>
                      thread.id === comment.parent_id
                          ? { ...thread, replies: [...thread.replies, comment] }
                          : thread,
                  ),
        );
        setCommentsCount(count);
    }

    // Removing a comment takes its replies with it (the server does too).
    function removeComment(commentId: number, count: number) {
        setThread((current) =>
            current
                .filter((thread) => thread.id !== commentId)
                .map((thread) =>
                    thread.replies.some((reply) => reply.id === commentId)
                        ? {
                              ...thread,
                              replies: thread.replies.filter(
                                  (reply) => reply.id !== commentId,
                              ),
                          }
                        : thread,
                ),
        );
        setCommentsCount(count);
    }

    function actions(onComment: () => void) {
        return (
            <PostActions
                like={like}
                onToggleLike={toggleLike}
                commentsCount={commentsCount}
                onComment={onComment}
                sharesCount={post.shares_count}
                share={{
                    postId: post.id,
                    title: `${source} on PHLGADIS`,
                    text:
                        post.body?.slice(0, 140) ??
                        `A post from ${source} in the Region XII community.`,
                    onShareToFeed: () => setShareOpen(true),
                }}
            />
        );
    }

    return (
        <article
            aria-labelledby={`post-${post.id}-source`}
            className="overflow-hidden rounded-[10px] border bg-card"
        >
            <header className="px-4 pt-4 sm:px-5">
                <PostByline
                    post={post}
                    edited={post.edited}
                    action={post.shared_post ? 'shared a post' : undefined}
                    titleId={`post-${post.id}-source`}
                >
                    {(post.can_edit || post.can_delete) && (
                        <DropdownMenu>
                            {/* "Delete post" in the menu opens this, pointing
                                at the options button. */}
                            <ConfirmPopover
                                title="Delete this post?"
                                description="The post, its photos, likes, comments, and shares will be removed for everyone. This cannot be undone."
                                confirmLabel="Delete post"
                                open={confirmDelete}
                                onOpenChange={setConfirmDelete}
                                anchorOnly
                                onConfirm={deletePost}
                            >
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="-mt-1 -mr-2 size-8 rounded-full text-muted-foreground"
                                    >
                                        <MoreHorizontal />
                                        <span className="sr-only">
                                            Post options
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                            </ConfirmPopover>
                            <DropdownMenuContent
                                align="end"
                                className="w-40"
                                onCloseAutoFocus={(event) => {
                                    // The menu has closed: open the delete
                                    // confirmation now, and let it take focus
                                    // instead of the options button.
                                    if (deleteChosen.current) {
                                        event.preventDefault();
                                        deleteChosen.current = false;
                                        setConfirmDelete(true);
                                    }
                                }}
                            >
                                {post.can_edit && (
                                    <DropdownMenuItem
                                        onSelect={() => {
                                            edit.setData(
                                                'body',
                                                post.body ?? '',
                                            );
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
                                        onSelect={() => {
                                            deleteChosen.current = true;
                                        }}
                                        className="text-destructive focus:text-destructive [&_svg]:!text-destructive"
                                    >
                                        <Trash2 />
                                        Delete post
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </PostByline>
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

            {hasPostMedia(post) && (
                <div className="px-4 pt-3 sm:px-5">
                    <PostMedia post={post} sharedBy={source} />
                </div>
            )}

            {post.shared_post && (
                <div className="px-4 pt-3 sm:px-5">
                    <SharedPostEmbed post={post.shared_post} />
                </div>
            )}

            <div className="mt-3">{actions(() => setCommentsOpen(true))}</div>

            <PostDialog
                post={post}
                open={commentsOpen}
                onOpenChange={setCommentsOpen}
                actions={actions(() => composerRef.current?.focus())}
                comments={thread}
                viewerName={auth.user.name}
                composerRef={composerRef}
                onCommentCreated={addComment}
                onCommentRemoved={removeComment}
            />
            <SharePostDialog
                post={post}
                open={shareOpen}
                onOpenChange={setShareOpen}
            />
        </article>
    );
}
