import { Head, Link, usePage } from '@inertiajs/react';
import { Building2, MapPin, Pencil, UsersRound } from 'lucide-react';
import { useState } from 'react';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import { AchievementTile } from '@/components/badges/achievement-tile';
import { BetaTag } from '@/components/beta-tag';
import { Feed } from '@/components/hei/feed';
import { ProfilePhoto } from '@/components/profile-photo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { myProfileHref } from '@/lib/my-profile';
import { dashboard } from '@/routes';
import { edit } from '@/routes/profile';
import { index as quests } from '@/routes/quests';
import type { Auth, Post, ScrollPage } from '@/types';
import type { ActivityEntry } from '@/types/activity';
import type { Achievement } from '@/types/badges';

/** Badges shown before "Show all". */
const FEATURED_BADGES = 6;

const roleNames: Record<string, string> = {
    admin: 'Administrator',
    'gad-focal-person': 'GAD Focal Person',
    'ched-focal': 'CHED Focal',
    'ched-employee': 'CHED Employee',
    'hei-focal': 'HEI Focal',
    hei: 'HEI User',
};

function profileAffiliation(auth: Auth, institution: string | null) {
    if (institution) return institution;
    if (auth.user.national_access) return 'CHED Central Office';
    if (auth.user.survey_region_id) return 'CHED regional office';
    return 'Affiliation not available in this preview';
}

/** Where this person posts: CHED staff in the staff feed, HEIs on their home. */
function postingHref(auth: Auth): string | null {
    if (auth.permissions.includes('posts.view')) return '/community';
    if (auth.heiOnly) return dashboard().url;
    return null;
}

/**
 * The signed-in person's profile: their Gender Mainstreaming posts, their
 * own activity log, and their account details. Posts and activity arrive
 * just after the page and load more as they scroll.
 */
export default function MyProfile({
    institution,
    achievements,
    posts,
    activity,
}: {
    institution: string | null;
    /** Badges and GAD Quest badges, newest first. */
    achievements: Achievement[];
    /** Deferred. */
    posts?: ScrollPage<Post>;
    /** Deferred. */
    activity?: ScrollPage<ActivityEntry>;
}) {
    const { auth } = usePage().props;
    const { user } = auth;
    const feedHref = postingHref(auth);
    const affiliation = profileAffiliation(auth, institution);
    const roles = auth.roles.map((role) => roleNames[role] ?? role);

    return (
        <>
            <Head title="My Profile" />
            <div className="w-full">
                <section
                    aria-labelledby="profile-name"
                    className="border-b border-border bg-card"
                >
                    <div className="bg-muted/50 lg:px-8">
                        <div
                            aria-hidden
                            data-test="profile-cover"
                            className="relative mx-auto min-h-56 w-full max-w-6xl overflow-hidden bg-signature-violet sm:min-h-72 lg:min-h-96"
                        >
                            <div className="absolute -top-20 right-0 size-64 rounded-full border border-on-signature/20 sm:right-16 sm:size-80" />
                            <div className="absolute -top-12 right-10 size-64 rounded-full border border-on-signature/20 sm:right-28 sm:size-80" />
                        </div>
                    </div>
                    <div className="@container lg:px-8">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-6 sm:px-6 lg:px-12 @3xl:flex-row @3xl:items-end @3xl:justify-between">
                            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
                                <ProfilePhoto
                                    name={user.name}
                                    src={user.avatar}
                                    editable
                                    className="-mt-14 size-28 self-start sm:-mt-18 sm:size-36 lg:-mt-20 lg:size-40"
                                    fallbackClassName="text-3xl sm:text-4xl"
                                />
                                <div className="min-w-0 sm:pb-1">
                                    <h1
                                        id="profile-name"
                                        className="text-2xl font-medium tracking-tight break-words sm:text-3xl"
                                    >
                                        {user.name}
                                    </h1>
                                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                                        <Building2
                                            aria-hidden
                                            className="mt-0.5 size-4 shrink-0"
                                        />
                                        <span>{affiliation}</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                asChild
                                variant="outline"
                                className="self-start @3xl:mb-1 @3xl:self-auto"
                            >
                                <Link href={edit()}>
                                    <Pencil aria-hidden />
                                    Edit account details
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>

                <div className="lg:px-8">
                    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 lg:px-12">
                        <div
                            data-test="profile-notice"
                            className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                        >
                            <span className="font-medium text-foreground">
                                Only you can see your profile.
                            </span>{' '}
                            Following and public profiles are not available yet.
                        </div>

                        <Achievements
                            badges={achievements}
                            canPlay={auth.playsQuests}
                        />

                        <Tabs defaultValue="posts" className="mt-8 gap-6">
                            <TabsList
                                aria-label="Profile sections"
                                className="h-auto max-w-full justify-start overflow-x-auto bg-transparent p-0"
                            >
                                <TabsTrigger
                                    value="posts"
                                    className="min-h-11 px-4"
                                >
                                    Posts
                                </TabsTrigger>
                                <TabsTrigger
                                    value="activity"
                                    className="min-h-11 px-4"
                                >
                                    Activity
                                </TabsTrigger>
                                <TabsTrigger
                                    value="about"
                                    className="min-h-11 px-4"
                                >
                                    About
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="posts">
                                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
                                    <section
                                        aria-labelledby="profile-posts"
                                        className="min-w-0"
                                    >
                                        <h2
                                            id="profile-posts"
                                            className="sr-only"
                                        >
                                            Your posts
                                        </h2>
                                        <Feed
                                            posts={posts}
                                            watchForNew={false}
                                            emptyTitle="You haven’t posted yet"
                                            emptyMessage="Your posts in Gender Mainstreaming will appear here: seminars, campaigns, and the other GAD work you share."
                                            emptyAction={
                                                feedHref && (
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                    >
                                                        <Link href={feedHref}>
                                                            Go to Gender
                                                            Mainstreaming
                                                        </Link>
                                                    </Button>
                                                )
                                            }
                                        />
                                    </section>

                                    <aside
                                        className="min-w-0 space-y-6"
                                        aria-label="Profile details"
                                    >
                                        <section className="rounded-xl border border-border bg-card p-5">
                                            <h2 className="text-base font-medium">
                                                About
                                            </h2>
                                            <dl className="mt-4 space-y-4 text-sm">
                                                <div>
                                                    <dt className="text-muted-foreground">
                                                        Affiliation
                                                    </dt>
                                                    <dd className="mt-1 flex items-start gap-2 font-medium">
                                                        <MapPin
                                                            aria-hidden
                                                            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                                                        />
                                                        {affiliation}
                                                    </dd>
                                                </div>
                                                {roles.length > 0 && (
                                                    <div>
                                                        <dt className="text-muted-foreground">
                                                            Role
                                                        </dt>
                                                        <dd className="mt-1 font-medium">
                                                            {roles.join(', ')}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                        </section>
                                        <section className="rounded-xl border border-border bg-card p-5">
                                            <div className="flex items-center gap-2">
                                                <UsersRound
                                                    aria-hidden
                                                    className="size-5 text-brand"
                                                />
                                                <h2 className="text-base font-medium">
                                                    Following
                                                </h2>
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                                Follow is the proposed way to
                                                keep up with another member’s
                                                GAD work. This feature is coming
                                                later.
                                            </p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled
                                                className="mt-4"
                                            >
                                                Follow · coming soon
                                            </Button>
                                        </section>
                                    </aside>
                                </div>
                            </TabsContent>
                            <TabsContent value="activity">
                                <section
                                    aria-labelledby="profile-activity"
                                    className="max-w-3xl"
                                >
                                    <h2
                                        id="profile-activity"
                                        className="sr-only"
                                    >
                                        Your activity
                                    </h2>
                                    <ActivityTimeline activity={activity} />
                                </section>
                            </TabsContent>
                            <TabsContent value="about">
                                <section className="max-w-2xl rounded-xl border border-border bg-card p-6">
                                    <h2 className="text-lg font-medium">
                                        Profile details
                                    </h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Your visible profile is based on your
                                        account details.
                                    </p>
                                    <dl className="mt-6 divide-y divide-border text-sm">
                                        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-muted-foreground">
                                                Name
                                            </dt>
                                            <dd className="font-medium">
                                                {user.name}
                                            </dd>
                                        </div>
                                        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-muted-foreground">
                                                Affiliation
                                            </dt>
                                            <dd className="font-medium">
                                                {affiliation}
                                            </dd>
                                        </div>
                                        {roles.length > 0 && (
                                            <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                                <dt className="text-muted-foreground">
                                                    Role
                                                </dt>
                                                <dd className="font-medium">
                                                    {roles.join(', ')}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="mt-6"
                                    >
                                        <Link href={edit()}>
                                            Manage account details
                                        </Link>
                                    </Button>
                                </section>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * Their badges and GAD Quest badges, like GitHub's achievements: the newest
 * few, each opening its details, and the way to all of them.
 */
function Achievements({
    badges,
    canPlay,
}: {
    badges: Achievement[];
    canPlay: boolean;
}) {
    const [showAll, setShowAll] = useState(false);

    if (badges.length === 0 && !canPlay) {
        return null;
    }

    return (
        <section aria-labelledby="achievements" className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2
                    id="achievements"
                    className="flex items-center gap-2 text-lg font-medium"
                >
                    Achievements
                    <BetaTag />
                </h2>
                {canPlay && (
                    <Link
                        href={quests()}
                        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                        Open GAD Quest
                    </Link>
                )}
            </div>
            {badges.length > 0 ? (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {(showAll ? badges : badges.slice(0, FEATURED_BADGES)).map(
                        (badge) => (
                            <li key={badge.key}>
                                <AchievementTile achievement={badge} />
                            </li>
                        ),
                    )}
                </ul>
            ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                    Share a photo of GAD work tagged with an SDG or an
                    A.C.H.I.E.V.E. item, or finish a GAD Quest, to earn your
                    first badge.
                </p>
            )}
            {badges.length > FEATURED_BADGES && (
                <Button
                    type="button"
                    variant="ghost"
                    className="mt-2"
                    aria-expanded={showAll}
                    onClick={() => setShowAll(!showAll)}
                >
                    {showAll
                        ? 'Show fewer'
                        : `Show all ${badges.length} badges`}
                </Button>
            )}
        </section>
    );
}

MyProfile.layout = {
    breadcrumbs: [{ title: 'My Profile', href: myProfileHref }],
};
