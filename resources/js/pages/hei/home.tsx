import { Head, usePage } from '@inertiajs/react';
import { EventCalendar } from '@/components/hei/event-calendar';
import { Feed } from '@/components/hei/feed';
import { FeedBanner } from '@/components/hei/feed-banner';
import { FeedTabs } from '@/components/hei/feed-tabs';
import { HomeRail } from '@/components/hei/home-rail';
import { InstitutionPeople } from '@/components/hei/institution-people';
import { NextEventCard } from '@/components/hei/next-event-card';
import { PostComposer } from '@/components/hei/post-composer';
import { QuickLinks } from '@/components/hei/quick-links';
import type { QuickLink } from '@/components/hei/quick-links';
import { SurveyPanel } from '@/components/hei/survey-panel';
import { UpcomingEvents } from '@/components/hei/upcoming-events';
import { WelcomeBand } from '@/components/hei/welcome-band';
import { useStickyRail } from '@/hooks/use-sticky-rail';
import { dashboard, home } from '@/routes';
import { create as feedback } from '@/routes/feedback';
import { faq } from '@/routes/help';
import type {
    CalendarEvent,
    CalendarMonth,
    HeiRef,
    HeiSurvey,
    InstitutionPeopleSummary,
    Post,
    ScrollPage,
} from '@/types';
import type { FeedScope } from '@/types/people';
import type { QuestCard } from '@/types/quests';

type Props = {
    hei: HeiRef | null;
    surveys: HeiSurvey[];
    calendar: CalendarMonth;
    upcoming: CalendarEvent[];
    /** Everyone's posts, or the people they follow. */
    feed: FeedScope;
    /** Deferred: arrives just after the page. */
    posts?: ScrollPage<Post>;
    quickLinks: QuickLink[];
    people: InstitutionPeopleSummary;
    /** The GAD Quest card's quest: the newest open to them. */
    quest: QuestCard | null;
};

/** Where to find help: the FAQ, the feedback form and the rating card. */
const helpLinks: QuickLink[] = [
    { key: 'faq', label: 'FAQ', href: faq.url() },
    { key: 'feedback', label: 'Send feedback', href: feedback.url() },
    // The homepage opens its Rate PHLGADIS card for #rate.
    { key: 'rate', label: 'Rate PHLGADIS', href: `${home.url()}#rate` },
];

/** Where the rails stick: under AppHeader's 57px bar, by 24px. */
const railOffset = { top: 57 + 24, bottom: 24 };

/**
 * The HEI home, the community feed, laid out like Facebook from 1280px: you,
 * the places to go, the law surveys and resources on the left, the posts in
 * the middle, events and links on the right, both rails staying in view
 * beside the feed. Narrower, the rails fold into one column (and, from
 * 1024px, the right rail beside it).
 */
export default function HeiHome({
    hei,
    surveys,
    calendar,
    upcoming,
    feed,
    posts,
    quickLinks,
    people,
    quest,
}: Props) {
    const { auth } = usePage().props;
    const [nextEvent, ...laterEvents] = upcoming;
    const leftRail = useStickyRail<HTMLElement>(railOffset);
    const rightRail = useStickyRail<HTMLElement>(railOffset);

    return (
        <>
            <Head title="Home" />
            <div
                data-surface="hei"
                data-layout="wide"
                className="w-full px-4 pb-20 sm:px-6 lg:px-8 xl:px-4"
            >
                <div className="xl:hidden">
                    <WelcomeBand hei={hei} userName={auth.user.name} />
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[17rem_minmax(0,42rem)_20rem] xl:justify-between xl:pt-6 2xl:grid-cols-[22rem_42rem_22rem]">
                    <aside
                        ref={leftRail}
                        aria-label="Your institution, law surveys and resources"
                        className="hidden min-w-0 xl:sticky xl:block xl:self-start"
                    >
                        <HomeRail hei={hei} surveys={surveys} quest={quest} />
                    </aside>

                    <div className="min-w-0 space-y-10">
                        <div className="xl:hidden">
                            <SurveyPanel surveys={surveys} />
                        </div>

                        {/* On small screens the time-bound items come before the feed. */}
                        <div className="space-y-4 lg:hidden">
                            <NextEventCard event={nextEvent} />
                            {laterEvents.length > 0 && (
                                <UpcomingEvents
                                    events={laterEvents}
                                    limit={3}
                                    title="Later"
                                />
                            )}
                            <QuickLinks links={quickLinks} />
                        </div>

                        <section
                            aria-labelledby="gad-efforts-title"
                            className="space-y-4"
                        >
                            <FeedBanner titleId="gad-efforts-title" />
                            <PostComposer
                                authorLabel={
                                    hei?.display_name ?? auth.user.name
                                }
                            />
                            <FeedTabs scope={feed} href={dashboard.url()} />
                            <Feed key={feed} posts={posts} scope={feed} />
                        </section>
                    </div>

                    <aside
                        ref={rightRail}
                        aria-label="Events and links"
                        className="hidden min-w-0 space-y-4 lg:sticky lg:block lg:self-start"
                    >
                        <NextEventCard event={nextEvent} />
                        <EventCalendar calendar={calendar} />
                        {laterEvents.length > 0 && (
                            <UpcomingEvents
                                events={laterEvents}
                                limit={4}
                                title="Later"
                            />
                        )}
                        <QuickLinks links={quickLinks} />
                        {/* Everyone at the HEI: people to ask, and where
                            to find help. */}
                        <InstitutionPeople summary={people} />
                        <QuickLinks title="Need help?" links={helpLinks} />
                    </aside>
                </div>
            </div>
        </>
    );
}
