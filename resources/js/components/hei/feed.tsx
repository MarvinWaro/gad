import { InfiniteScroll } from '@inertiajs/react';
import { MessagesSquare } from 'lucide-react';
import { PostCard } from '@/components/hei/post-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Post, ScrollPage } from '@/types';

function PostSkeleton() {
    return (
        <div
            aria-hidden
            className="rounded-[10px] border bg-card px-4 py-4 sm:px-5"
        >
            <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            </div>
            <Skeleton className="mt-4 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-4/5" />
            <Skeleton className="mt-4 aspect-[16/10] w-full rounded-[10px]" />
        </div>
    );
}

/** The community feed, loading older posts as the reader nears the end. */
export function Feed({
    posts,
    emptyMessage = 'No posts yet. Share your first GAD activity above: a seminar, a campaign, or a new policy on campus.',
}: {
    posts: ScrollPage<Post>;
    emptyMessage?: string;
}) {
    if (posts.data.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-[10px] border border-dashed px-6 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <MessagesSquare aria-hidden className="size-5" />
                </span>
                <p className="mt-4 font-medium">The feed is quiet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {emptyMessage}
                </p>
            </div>
        );
    }

    return (
        <InfiniteScroll
            data="posts"
            preserveUrl
            buffer={800}
            className="space-y-4"
            loading={<PostSkeleton />}
        >
            {posts.data.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
        </InfiniteScroll>
    );
}
