import { Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import { Building2, MapPin, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ActivityTimeline } from '@/components/activity/activity-timeline';
import { AchievementTile } from '@/components/badges/achievement-tile';
import { Medal } from '@/components/badges/medal';
import { BetaTag } from '@/components/beta-tag';
import { Feed } from '@/components/hei/feed';
import { FollowButton } from '@/components/people/follow-button';
import { FollowListDialog } from '@/components/people/follow-list-dialog';
import { ProfilePhoto } from '@/components/profile-photo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { myProfileHref } from '@/lib/my-profile';
import { dashboard } from '@/routes';
import { show as profileOf } from '@/routes/people';
import { edit } from '@/routes/profile';
import { index as quests } from '@/routes/quests';
import type { Auth, Post, ScrollPage } from '@/types';
import type { ActivityPage } from '@/types/activity';
import type { Achievement, BadgeToEarn, QuestLevelBadge } from '@/types/badges';
import type { PersonProfile } from '@/types/people';

/** Badges in the highlights row, before "+N". */
const HIGHLIGHTS = 6;

const roleNames: Record<string, string> = {
    admin: 'Administrator',
    'gad-focal-person': 'GAD Focal Person',
    'ched-focal': 'CHED Focal',
    'ched-employee': 'CHED Employee',
    'hei-focal': 'HEI Focal',
    hei: 'HEI User',
};

type Tab = 'posts' | 'activity' | 'about' | 'badges';

type ProfileProps = {
    /** The reader's own profile. */
    own: boolean;
    person: PersonProfile;
    /** Badges and GAD Quest badges, greatest first. */
    achievements: Achievement[];
    /** Your own profile: the badges for sharing GAD work not earned yet. */
    toEarn: BadgeToEarn[];
    /** Your own profile: the GAD Quest levels, Participant first. */
    questLevels: QuestLevelBadge[];
    /** Deferred. */
    posts?: ScrollPage<Post>;
    /** Your own profile only. Deferred. */
    activity?: ActivityPage;
};

/** Where this person posts: CHED staff in the staff feed, HEIs on their home. */
function postingHref(auth: Auth): string | null {
    if (auth.permissions.includes('posts.view')) return '/community';
    if (auth.heiOnly) return dashboard().url;
    return null;
}

/** The tab a link asked for (`?tab=badges`), if it is one this profile has. */
function tabFromUrl(url: string, own: boolean): Tab {
    const asked = new URLSearchParams(url.split('?')[1] ?? '').get('tab');
    const tabs: Tab[] = own
        ? ['posts', 'activity', 'about', 'badges']
        : ['posts', 'about', 'badges'];

    return tabs.find((tab) => tab === asked) ?? 'posts';
}

/**
 * A profile: your own (`/profile`) or anyone else's (`/people/{ulid}`), as on
 * Facebook. Their photo and place, who follows them, their greatest badges,
 * then Posts, About and Badges; your own adds your activity and the badges
 * you can still earn.
 */
export default function Profile(props: ProfileProps) {
    const { person, own } = props;

    setLayoutProps({
        breadcrumbs: [
            own
                ? { title: 'My Profile', href: myProfileHref }
                : { title: person.name, href: profileOf.url(person.ulid) },
        ],
    });

    // A new person starts afresh: their own tab, counts and follow state.
    return <ProfileView key={person.id} {...props} />;
}

function ProfileView({
    own,
    person,
    achievements,
    toEarn,
    questLevels,
    posts,
    activity,
}: ProfileProps) {
    const page = usePage();
    const { auth } = page.props;
    const [tab, setTab] = useState<Tab>(() => tabFromUrl(page.url, own));
    const [followers, setFollowers] = useState(person.followers_count);
    const tabsRef = useRef<HTMLDivElement>(null);
    // The badge to focus once the Badges tab shows.
    const focusBadge = useRef<string | null>(null);
    const feedHref = own ? postingHref(auth) : null;
    const roles = own ? auth.roles.map((role) => roleNames[role] ?? role) : [];

    useEffect(() => {
        const key = focusBadge.current;

        if (tab !== 'badges' || key === null) {
            return;
        }

        focusBadge.current = null;
        // The tab's panel mounts a frame after the tab is chosen.
        const frame = window.requestAnimationFrame(() => {
            const reduced = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;
            tabsRef.current?.scrollIntoView({
                block: 'start',
                behavior: reduced ? 'auto' : 'smooth',
            });
            document
                .querySelector<HTMLElement>(
                    `[data-achievement="${CSS.escape(key)}"] button`,
                )
                ?.focus({ preventScroll: true });
        });

        return () => window.cancelAnimationFrame(frame);
    }, [tab]);

    function openBadges(key: string | null) {
        focusBadge.current = key ?? achievements[0]?.key ?? null;
        setTab('badges');

        if (focusBadge.current === null) {
            tabsRef.current?.scrollIntoView({ block: 'start' });
        }
    }

    return (
        <>
            <Head title={own ? 'My Profile' : person.name} />
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
                                    name={person.name}
                                    src={person.avatar}
                                    editable={own}
                                    className="-mt-14 size-28 self-start sm:-mt-18 sm:size-36 lg:-mt-20 lg:size-40"
                                    fallbackClassName="text-3xl sm:text-4xl"
                                />
                                <div className="min-w-0 sm:pb-1">
                                    <h1
                                        id="profile-name"
                                        className="text-2xl font-medium tracking-tight break-words sm:text-3xl"
                                    >
                                        {person.name}
                                    </h1>
                                    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                                        <Building2
                                            aria-hidden
                                            className="mt-0.5 size-4 shrink-0"
                                        />
                                        <span>{person.affiliation}</span>
                                    </p>
                                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <FollowListDialog
                                            person={person}
                                            kind="followers"
                                            count={followers}
                                        />
                                        <span
                                            aria-hidden
                                            className="text-muted-foreground"
                                        >
                                            ·
                                        </span>
                                        <FollowListDialog
                                            person={person}
                                            kind="following"
                                            count={person.following_count}
                                        />
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 self-start @3xl:mb-1 @3xl:self-auto">
                                {own ? (
                                    <Button asChild variant="outline">
                                        <Link href={edit()}>
                                            <Pencil aria-hidden />
                                            Edit account details
                                        </Link>
                                    </Button>
                                ) : (
                                    <>
                                        {person.follows_you && (
                                            <span className="rounded-[6px] bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                                Follows you
                                            </span>
                                        )}
                                        {person.deactivated ? (
                                            <span className="text-sm text-muted-foreground italic">
                                                Deactivated account
                                            </span>
                                        ) : (
                                            person.can_follow && (
                                                <FollowButton
                                                    person={person}
                                                    onChange={(state) =>
                                                        setFollowers(
                                                            state.followers_count,
                                                        )
                                                    }
                                                />
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="lg:px-8">
                    <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 lg:px-12">
                        <AchievementHighlights
                            badges={achievements}
                            own={own}
                            onOpen={openBadges}
                        />

                        <Tabs
                            value={tab}
                            onValueChange={(value) => setTab(value as Tab)}
                            className="mt-8 gap-6"
                        >
                            <div
                                ref={tabsRef}
                                className="scroll-mt-below-header"
                            >
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
                                    {own && (
                                        <TabsTrigger
                                            value="activity"
                                            className="min-h-11 px-4"
                                        >
                                            Activity
                                        </TabsTrigger>
                                    )}
                                    <TabsTrigger
                                        value="about"
                                        className="min-h-11 px-4"
                                    >
                                        About
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="badges"
                                        className="min-h-11 gap-2 px-4"
                                    >
                                        Badges
                                        {achievements.length > 0 && (
                                            <span className="rounded-full bg-brand px-1.5 py-0.5 text-xs leading-none font-medium text-brand-foreground tabular-nums">
                                                {achievements.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

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
                                            {own
                                                ? 'Your posts'
                                                : `${person.name}’s posts`}
                                        </h2>
                                        <Feed
                                            posts={posts}
                                            watchForNew={false}
                                            emptyTitle={
                                                own
                                                    ? 'You haven’t posted yet'
                                                    : `${person.name} hasn’t posted yet`
                                            }
                                            emptyMessage={
                                                own
                                                    ? 'Your posts in Gender Mainstreaming will appear here: seminars, campaigns, and the other GAD work you share.'
                                                    : 'Their posts in Gender Mainstreaming will appear here.'
                                            }
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
                                                        {person.affiliation}
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
                                    </aside>
                                </div>
                            </TabsContent>
                            {own && (
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
                            )}
                            <TabsContent value="about">
                                <section className="max-w-2xl rounded-xl border border-border bg-card p-6">
                                    <h2 className="text-lg font-medium">
                                        Profile details
                                    </h2>
                                    {own && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            What others see on your profile
                                            comes from your account details.
                                            Your email and roles stay private.
                                        </p>
                                    )}
                                    <dl className="mt-6 divide-y divide-border text-sm">
                                        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-muted-foreground">
                                                Name
                                            </dt>
                                            <dd className="font-medium">
                                                {person.name}
                                            </dd>
                                        </div>
                                        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-muted-foreground">
                                                Affiliation
                                            </dt>
                                            <dd className="font-medium">
                                                {person.affiliation}
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
                                    {own && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="mt-6"
                                        >
                                            <Link href={edit()}>
                                                Manage account details
                                            </Link>
                                        </Button>
                                    )}
                                </section>
                            </TabsContent>
                            <TabsContent value="badges">
                                <BadgesTab
                                    own={own}
                                    name={person.name}
                                    badges={achievements}
                                    toEarn={toEarn}
                                    questLevels={questLevels}
                                    canPlay={own && auth.playsQuests}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * Their greatest badges as a row of medals, like GitHub's achievements:
 * each opens the Badges tab at that badge, and "+N" opens the rest.
 */
function AchievementHighlights({
    badges,
    own,
    onOpen,
}: {
    badges: Achievement[];
    own: boolean;
    onOpen: (key: string | null) => void;
}) {
    if (badges.length === 0 && !own) {
        return null;
    }

    const shown = badges.slice(0, HIGHLIGHTS);
    const more = badges.length - shown.length;

    return (
        <section aria-labelledby="achievements">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2
                    id="achievements"
                    className="flex items-center gap-2 text-lg font-medium"
                >
                    Achievements
                    <BetaTag />
                </h2>
                <Button
                    type="button"
                    variant="link"
                    onClick={() => onOpen(null)}
                    className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground"
                >
                    {badges.length > 0
                        ? 'See all badges'
                        : 'How to earn badges'}
                </Button>
            </div>
            {badges.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                    {shown.map((badge) => {
                        const name = badge.caption
                            ? `${badge.name}, ${badge.caption}`
                            : badge.name;

                        return (
                            <li key={badge.key}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            aria-label={name}
                                            onClick={() => onOpen(badge.key)}
                                            className="grid size-14 place-items-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-safe:transition-colors"
                                        >
                                            <Medal
                                                kind={badge.medal}
                                                image={badge.image}
                                                className="size-12"
                                            />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        {name}
                                    </TooltipContent>
                                </Tooltip>
                            </li>
                        );
                    })}
                    {more > 0 && (
                        <li>
                            <button
                                type="button"
                                aria-label={`See all ${badges.length} badges`}
                                onClick={() => onOpen(badges[HIGHLIGHTS].key)}
                                className="grid size-14 place-items-center rounded-full bg-muted text-sm font-medium tabular-nums outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                +{more}
                            </button>
                        </li>
                    )}
                </ul>
            ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                    Share a photo of GAD work tagged with an SDG or an
                    A.C.H.I.E.V.E. item, or finish a GAD Quest, to earn your
                    first badge.
                </p>
            )}
        </section>
    );
}

/**
 * Every badge they hold, greatest first, each opening its details. On your
 * own profile, the badges still to earn and how.
 */
function BadgesTab({
    own,
    name,
    badges,
    toEarn,
    questLevels,
    canPlay,
}: {
    own: boolean;
    name: string;
    badges: Achievement[];
    toEarn: BadgeToEarn[];
    questLevels: QuestLevelBadge[];
    canPlay: boolean;
}) {
    const champion = questLevels.find((level) => level.level === 'champion');

    return (
        <div className="space-y-10">
            <section aria-labelledby="profile-badges">
                <h2
                    id="profile-badges"
                    className="flex items-center gap-2 text-lg font-medium"
                >
                    {own ? 'Your badges' : 'Badges'}
                    <BetaTag />
                </h2>
                {badges.length > 0 ? (
                    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {badges.map((badge) => (
                            <li key={badge.key} data-achievement={badge.key}>
                                <AchievementTile achievement={badge} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                        {own
                            ? 'No badges yet. Earn the ones below by sharing your GAD work.'
                            : `${name} has no badges yet.`}
                    </p>
                )}
            </section>

            {own && (toEarn.length > 0 || canPlay) && (
                <section aria-labelledby="badges-to-earn">
                    <h2 id="badges-to-earn" className="text-base font-medium">
                        Still to earn
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Badges come by themselves as you share GAD work in
                        Gender Mainstreaming.
                    </p>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {toEarn.map((badge) => (
                            <li
                                key={badge.key}
                                className="flex items-start gap-3 rounded-xl border bg-card p-3"
                            >
                                <Medal
                                    kind={badge.medal}
                                    image={badge.image}
                                    className="size-12 opacity-50"
                                />
                                <div className="min-w-0 text-sm">
                                    <p className="font-medium">{badge.name}</p>
                                    <p className="mt-0.5 text-muted-foreground">
                                        {badge.criterion}
                                    </p>
                                </div>
                            </li>
                        ))}
                        {canPlay && (
                            <li className="flex items-start gap-3 rounded-xl border bg-card p-3">
                                <Medal
                                    kind="champion"
                                    image={champion?.image}
                                    className="size-12 opacity-50"
                                />
                                <div className="min-w-0 text-sm">
                                    <p className="font-medium">
                                        GAD Quest badges
                                    </p>
                                    <p className="mt-0.5 text-muted-foreground">
                                        Finish a GAD Quest to earn{' '}
                                        {new Intl.ListFormat('en', {
                                            type: 'disjunction',
                                        }).format(
                                            questLevels.map(
                                                (level) => level.name,
                                            ),
                                        )}
                                        .
                                    </p>
                                    <Link
                                        href={quests()}
                                        className="mt-1 inline-block font-medium underline underline-offset-2"
                                    >
                                        Open GAD Quest
                                    </Link>
                                </div>
                            </li>
                        )}
                    </ul>
                </section>
            )}
        </div>
    );
}
