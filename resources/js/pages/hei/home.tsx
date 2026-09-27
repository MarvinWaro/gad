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
    posts: ScrollPage<Post>;
    quickLinks: QuickLink[];
};

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
    // Clears AppHeader's sticky bar (h-16 plus its 1px border) by 24px.
    const railRef = useStickyRail<HTMLElement>({ top: 65 + 24, bottom: 24 });

    return (
        <>
            <Head title="Home" />
            <div
                data-surface="hei"
                className="w-full px-4 pb-20 sm:px-6 lg:px-8"
            >
                <WelcomeBand hei={hei} userName={auth.user.name} />

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="min-w-0 space-y-10">
                        <SurveyPanel surveys={surveys} />

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
                            aria-labelledby="community-title"
                            className="space-y-4"
                        >
                            <header>
                                <h2
                                    id="community-title"
                                    className="text-xl font-normal"
                                >
                                    Community
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Gender and development activities shared by
                                    HEIs across Region XII.
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
                        ref={railRef}
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
