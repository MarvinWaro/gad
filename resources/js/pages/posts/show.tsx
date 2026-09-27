import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PostCard } from '@/components/hei/post-card';
import { sourceOf } from '@/components/hei/post-parts';
import type { Post } from '@/types';

/**
 * A post on its own page: where a link sent by message or email lands.
 * It opens straight into the post, like following a Facebook post link.
 */
export default function PostShow({
    post,
    feedUrl,
}: {
    post: Post;
    feedUrl: string;
}) {
    return (
        <>
            <Head title={`${sourceOf(post)}’s post`} />
            <div
                data-surface="hei"
                className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 sm:px-6"
            >
                <Link
                    href={feedUrl}
                    className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <ArrowLeft aria-hidden className="size-4" />
                    Back to the community feed
                </Link>
                <PostCard post={post} openOnArrival />
            </div>
        </>
    );
}
