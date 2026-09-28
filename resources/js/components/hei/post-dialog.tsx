import { MessageCircle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { CommentComposer, CommentList } from '@/components/hei/post-comments';
import { hasPostMedia, PostMedia } from '@/components/hei/post-goals';
import {
    PostByline,
    SharedPostEmbed,
    sourceOf,
} from '@/components/hei/post-parts';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Post, PostComment } from '@/types';

/**
 * A post opened on its own, like Facebook's "…'s post": the full text, its
 * photos, the whole thread, and a comment box pinned to the bottom. The post
 * card owns the thread, so nothing is lost when this closes.
 */
export function PostDialog({
    post,
    open,
    onOpenChange,
    actions,
    comments,
    viewerName,
    composerRef,
    onCommentCreated,
    onCommentRemoved,
}: {
    post: Post;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actions: ReactNode;
    comments: PostComment[];
    viewerName: string;
    composerRef: RefObject<HTMLTextAreaElement | null>;
    onCommentCreated: (comment: PostComment, count: number) => void;
    onCommentRemoved: (commentId: number, count: number) => void;
}) {
    const source = sourceOf(post);
    const threadEnd = useRef<HTMLDivElement>(null);
    const scrollToNewComment = useRef(false);

    // Bring a comment the viewer just posted into view, as Facebook does.
    useEffect(() => {
        if (scrollToNewComment.current) {
            scrollToNewComment.current = false;
            threadEnd.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
            });
        }
    }, [comments.length]);

    function handleCreated(comment: PostComment, count: number) {
        // A reply appears where it was written; only new threads scroll.
        scrollToNewComment.current = comment.parent_id === null;
        onCommentCreated(comment, count);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                data-surface="hei"
                showCloseButton={false}
                // Opening from "Comment" lands in the comment box.
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    composerRef.current?.focus();
                }}
                className="flex max-h-[min(92dvh,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[42rem]"
            >
                <header className="relative flex h-15 shrink-0 items-center justify-center border-b px-14">
                    <DialogTitle className="truncate text-base font-medium">
                        {source}’s post
                    </DialogTitle>
                    <DialogClose className="absolute right-3 flex size-9 items-center justify-center rounded-full bg-muted outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50">
                        <X aria-hidden className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </header>
                <DialogDescription className="sr-only">
                    The full post and its comments. Write a comment at the
                    bottom.
                </DialogDescription>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="px-4 pt-4 sm:px-5">
                        <PostByline
                            post={post}
                            edited={post.edited}
                            action={
                                post.shared_post ? 'shared a post' : undefined
                            }
                        />
                    </div>
                    {post.body && (
                        <p className="px-4 pt-3 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line sm:px-5">
                            {post.body}
                        </p>
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

                    <div className="mt-3">{actions}</div>

                    <section
                        aria-label="Comments"
                        className="border-t px-4 py-4 sm:px-5"
                    >
                        {comments.length > 0 ? (
                            <CommentList
                                postId={post.id}
                                comments={comments}
                                hasMore={post.has_more_comments}
                                viewerName={viewerName}
                                onCreated={handleCreated}
                                onRemoved={onCommentRemoved}
                            />
                        ) : (
                            <div className="flex flex-col items-center py-8 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <MessageCircle
                                        aria-hidden
                                        className="size-5"
                                    />
                                </span>
                                <p className="mt-3 font-medium">
                                    No comments yet
                                </p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Be the first to comment.
                                </p>
                            </div>
                        )}
                    </section>
                    <div ref={threadEnd} />
                </div>

                <div className="shrink-0 border-t px-4 py-3 sm:px-5">
                    <CommentComposer
                        postId={post.id}
                        authorName={viewerName}
                        onCreated={handleCreated}
                        inputRef={composerRef}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
