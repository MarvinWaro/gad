import { Head } from '@inertiajs/react';
import { Feed } from '@/components/hei/feed';
import { PostComposer } from '@/components/hei/post-composer';
import Heading from '@/components/heading';
import type { Post, ScrollPage } from '@/types';

/** The community feed for moderators, inside the staff shell. */
export default function Community({ posts }: { posts: ScrollPage<Post> }) {
    return (
        <>
            <Head title="Community" />
            <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
                <Heading
                    title="Community"
                    description="Posts from HEIs across Region XII. Remove anything that breaks the community's standards from a post's menu."
                />
                <PostComposer
                    authorLabel="CHED Regional Office XII"
                    official
                    placeholder="Share an announcement from CHED Regional Office XII…"
                />
                <Feed
                    posts={posts}
                    emptyMessage="No HEI has posted yet. Posts appear here as soon as they are shared."
                />
            </div>
        </>
    );
}

Community.layout = {
    breadcrumbs: [{ title: 'Community', href: '/community' }],
};
