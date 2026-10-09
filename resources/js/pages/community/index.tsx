import { Head, usePage } from '@inertiajs/react';
import { Feed } from '@/components/hei/feed';
import { FeedTabs } from '@/components/hei/feed-tabs';
import { PostComposer } from '@/components/hei/post-composer';
import Heading from '@/components/heading';
import type { Post, ScrollPage } from '@/types';
import type { FeedRegion, FeedScope } from '@/types/people';

/** The Gender Mainstreaming feed for CHED staff, inside the staff shell. */
export default function Community({
    feed,
    feedRegion,
    posts,
}: {
    /** Everyone's posts, or the people the reader follows. */
    feed: FeedScope;
    /** Their office's region, for the My region tab; null for the Central Office. */
    feedRegion: FeedRegion;
    /** Deferred: arrives just after the page. */
    posts?: ScrollPage<Post>;
}) {
    const { auth } = usePage().props;
    const moderator = auth.permissions.includes('posts.moderate');
    // Staff post for their own CHED office, such as "CHED Regional Office IV".
    const office = auth.affiliation ?? 'CHED';

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
                    authorLabel={office}
                    official
                    placeholder={`Share an announcement from ${office}…`}
                />
                <FeedTabs scope={feed} href="/community" region={feedRegion} />
                <Feed
                    key={feed}
                    posts={posts}
                    scope={feed}
                    emptyMessage={
                        feed === 'all'
                            ? 'No HEI has posted yet. Posts appear here as soon as they are shared.'
                            : undefined
                    }
                />
            </div>
        </>
    );
}

Community.layout = {
    breadcrumbs: [{ title: 'Gender Mainstreaming', href: '/community' }],
};
