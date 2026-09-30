import { Head, usePage } from '@inertiajs/react';
import { Feed } from '@/components/hei/feed';
import { PostComposer } from '@/components/hei/post-composer';
import Heading from '@/components/heading';
import type { Post, ScrollPage } from '@/types';

/** The Gender Mainstreaming feed for CHED staff, inside the staff shell. */
export default function Community({
    posts,
}: {
    /** Deferred: arrives just after the page. */
    posts?: ScrollPage<Post>;
}) {
    const { auth } = usePage().props;
    const moderator = auth.permissions.includes('posts.moderate');

    return (
        <>
            <Head title="Gender Mainstreaming" />
            <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
                <Heading
                    title="HEI Gender Mainstreaming Efforts"
                    description={
                        moderator
                            ? "Posts from HEIs on promoting gender equality and inclusivity. Remove anything that breaks the community's standards from a post's menu."
                            : 'Posts from HEIs on promoting gender equality and inclusivity.'
                    }
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
    breadcrumbs: [{ title: 'Gender Mainstreaming', href: '/community' }],
};
