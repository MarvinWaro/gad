import { Head } from '@inertiajs/react';
import { EventCalendar } from '@/components/hei/event-calendar';
import { UpcomingEvents } from '@/components/hei/upcoming-events';
import { parseMonthKey } from '@/lib/event-dates';
import type { CalendarEvent, CalendarMonth } from '@/types';

const monthName = new Intl.DateTimeFormat('en-PH', { month: 'long' });

export default function HeiEvents({
    calendar,
    after,
}: {
    calendar: CalendarMonth;
    after: CalendarEvent[];
}) {
    const month = monthName.format(parseMonthKey(calendar.month));

    return (
        <>
            <Head title="GAD events" />
            <div
                data-surface="hei"
                className="w-full px-4 pb-20 sm:px-6 lg:px-8"
            >
                <header className="pt-8 pb-8 sm:pt-12">
                    <h1 className="text-[1.75rem] leading-tight font-normal sm:text-[2rem]">
                        GAD events
                    </h1>
                    <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                        Regional trainings, campaigns, meetings, and deadlines
                        from CHED Regional Office XII. Times are Philippine
                        time.
                    </p>
                </header>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                    <div className="min-w-0 space-y-6">
                        <EventCalendar
                            calendar={calendar}
                            size="large"
                            reload={['calendar', 'after']}
                        />
                        <UpcomingEvents
                            events={calendar.events}
                            title={`All events in ${month}`}
                            emptyMessage="Nothing is scheduled this month."
                            showCalendarLink={false}
                        />
                    </div>
                    <UpcomingEvents
                        events={after}
                        title={`After ${month}`}
                        emptyMessage={`Nothing is scheduled after ${month} yet.`}
                        showCalendarLink={false}
                        className="self-start"
                    />
                </div>
            </div>
        </>
    );
}
