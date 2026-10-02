import { Head, usePage } from '@inertiajs/react';
import { EventCalendar } from '@/components/hei/event-calendar';
import { Feed } from '@/components/hei/feed';
import { NextEventCard } from '@/components/hei/next-event-card';
import { PostComposer } from '@/components/hei/post-composer';
import { QuickLinks } from '@/components/hei/quick-links';
import type { QuickLink } from '@/components/hei/quick-links';
import { SurveyPanel } from '@/components/hei/survey-panel';
import { UpcomingEvents } from '@/components/hei/upcoming-events';
import { WelcomeBand } from '@/components/hei/welcome-band';
import { useStickyRail } from '@/hooks/use-sticky-rail';
import type {
    CalendarEvent,
    CalendarMonth,
    HeiSummary,
    HeiSurvey,
    Post,
    ScrollPage,
} from '@/types';

type Props = {
    hei: HeiSummary | null;
    surveys: HeiSurvey[];
    calendar: CalendarMonth;
    upcoming: CalendarEvent[];
    /** Deferred: arrives just after the page. */
    posts?: ScrollPage<Post>;
    quickLinks: QuickLink[];
};

/** Where the rails stick: under AppHeader's 57px bar, by 24px. */
const railOffset = { top: 57 + 24, bottom: 24 };

/**
 * The HEI home, laid out like Facebook from 1280px: the institution and its
 * law surveys on the left, the posts in the middle, events and links on the
 * right, both rails staying in view beside the feed. Narrower, the rails
 * fold into one column (and, from 1024px, the right rail beside it).
 */
export default function HeiHome({
    hei,
    surveys,
    calendar,
    upcoming,
    posts,
    quickLinks,
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
                        aria-label="Your institution and law surveys"
                        className="hidden min-w-0 space-y-6 xl:sticky xl:block xl:self-start"
                    >
                        <WelcomeBand
                            hei={hei}
                            userName={auth.user.name}
                            compact
                        />
                        <SurveyPanel surveys={surveys} variant="rail" />
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
                            {/* Title and line as the old PHLGADIS HEI page
                                has them, word for word. */}
                            <header>
                                <h2
                                    id="gad-efforts-title"
                                    className="text-xl font-normal"
                                >
                                    HEI Gender Mainstreaming Efforts
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Promoting gender equality and inclusivity in
                                    our school community
                                </p>
                            </header>
                            <PostComposer
                                authorLabel={
                                    hei?.display_name ?? auth.user.name
                                }
                            />
                            <Feed posts={posts} />
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
                    </aside>
                </div>
            </div>
        </>
    );
}
