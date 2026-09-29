import { InfiniteScroll } from '@inertiajs/react';
import { ArrowUp, CircleCheck, MessagesSquare } from 'lucide-react';
import { PostCard } from '@/components/hei/post-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewPosts } from '@/hooks/use-new-posts';
import { cn } from '@/lib/utils';
import type { Post, ScrollPage } from '@/types';

/** A post card's outline while it loads: byline, text, photo, actions. */
function PostSkeleton({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn(
                'overflow-hidden rounded-[10px] border bg-card',
                className,
            )}
        >
            <div className="px-4 pt-4 sm:px-5">
                <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
                <Skeleton className="mt-4 h-3.5 w-full" />
                <Skeleton className="mt-2 h-3.5 w-4/5" />
                <Skeleton className="mt-3 aspect-[16/10] w-full rounded-[10px]" />
            </div>
            <div className="mt-3 flex items-center gap-1 border-t px-2 py-1.5 sm:px-3">
                {[0, 1, 2].map((action) => (
                    <span
                        key={action}
                        className="grid size-9 place-items-center"
                    >
                        <Skeleton className="size-4.5" />
                    </span>
                ))}
                <Skeleton className="mr-2 ml-auto h-5 w-12 rounded-full" />
            </div>
        </div>
    );
}

function newPostsLabel(count: number): string {
    return count === 1
        ? '1 new post'
        : `${count > 99 ? '99+' : count} new posts`;
}

type FeedProps = {
    posts: ScrollPage<Post>;
    emptyMessage?: string;
};

/**
 * The Gender Mainstreaming feed. Its first page arrives just after the page
 * itself (a deferred prop), with skeleton posts standing in meanwhile.
 */
export function Feed({
    posts,
    emptyMessage,
}: Omit<FeedProps, 'posts'> & { posts?: ScrollPage<Post> }) {
    if (!posts) {
        return (
            <div aria-busy="true" className="space-y-4">
                <p role="status" className="sr-only">
                    Loading posts
                </p>
                <PostSkeleton />
                <PostSkeleton />
            </div>
        );
    }

    return <LoadedFeed posts={posts} emptyMessage={emptyMessage} />;
}

/**
 * Older posts load as the reader nears the end; newer ones are checked for
 * when the reader comes back to the page, loading straight in at the top or
 * waiting behind a button further down.
 */
function LoadedFeed({
    posts,
    emptyMessage = 'No posts yet. Share your first GAD activity above: a seminar, a campaign, or a new policy on campus.',
}: FeedProps) {
    const { waiting, refreshing, refresh } = useNewPosts(posts.data[0] ?? null);

    return (
        <div aria-busy={refreshing}>
            {/* Takes no space: the button floats under the top bar. */}
            {waiting > 0 && (
                <div className="sticky top-[calc(var(--app-header,0px)+0.75rem)] z-20 flex h-0 items-start justify-center">
                    <Button
                        type="button"
                        onClick={() => refresh(true)}
                        className="h-9 rounded-lg px-4 shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2"
                    >
                        <ArrowUp aria-hidden />
                        {newPostsLabel(waiting)}
                    </Button>
                </div>
            )}
            <p role="status" className="sr-only">
                {refreshing
                    ? 'Loading new posts'
                    : waiting > 0
                      ? `${newPostsLabel(waiting)}. Use the button at the top of the feed to see them.`
                      : ''}
            </p>
            {refreshing && <PostSkeleton className="mb-4" />}

            {posts.data.length === 0 ? (
                <div className="flex flex-col items-center rounded-[10px] border border-dashed px-6 py-12 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <MessagesSquare aria-hidden className="size-5" />
                    </span>
                    <p className="mt-4 font-medium">The feed is quiet</p>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        {emptyMessage}
                    </p>
                </div>
            ) : (
                <InfiniteScroll
                    data="posts"
                    preserveUrl
                    buffer={800}
                    className="space-y-4"
                    next={({ loading, hasMore }) =>
                        loading ? (
                            <PostSkeleton className="mt-4" />
                        ) : (
                            !hasMore && (
                                <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                    <CircleCheck
                                        aria-hidden
                                        className="size-4"
                                    />
                                    You’re all caught up
                                </p>
                            )
                        )
                    }
                >
                    {posts.data.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </InfiniteScroll>
            )}
        </div>
    );
}
