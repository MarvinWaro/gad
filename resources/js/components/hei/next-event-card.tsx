import { Link } from '@inertiajs/react';
import { ArrowRight, MapPin } from 'lucide-react';
import { JoinedMark } from '@/components/events/joined-mark';
import { formatEventTime, parseWallClock } from '@/lib/event-dates';
import { cn } from '@/lib/utils';
import { show as eventPage } from '@/routes/events';
import type { CalendarEvent } from '@/types';

const linkClass =
    'inline-flex items-center gap-1.5 rounded-sm text-sm text-on-signature underline decoration-on-signature/40 underline-offset-4 outline-none hover:decoration-on-signature focus-visible:ring-[3px] focus-visible:ring-on-signature/50';

const longDate = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
});
const monthShort = new Intl.DateTimeFormat('en-PH', { month: 'short' });

/**
 * The page's one signature surface (DESIGN.md forest card): the next regional
 * event, so the most time-bound thing on the page is the easiest to see.
 */
export function NextEventCard({
    event,
    className,
}: {
    event: CalendarEvent | undefined;
    className?: string;
}) {
    if (!event) {
        return (
            <section
                aria-label="Next event"
                className={cn(
                    'rounded-[12px] bg-signature-violet p-6 text-on-signature',
                    className,
                )}
            >
                <p className="text-lg leading-snug">No events scheduled yet</p>
                <p className="mt-2 text-sm text-on-signature/75">
                    Regional trainings, campaigns, and deadlines from CHED will
                    appear here.
                </p>
            </section>
        );
    }

    const start = parseWallClock(event.starts_at);
    // Its page is where people join it (docs/event-registration.md).
    const viewLabel =
        event.joined || event.category === 'deadline'
            ? 'View event'
            : 'View and join';

    return (
        <section
            aria-label="Next event"
            className={cn(
                'rounded-[12px] bg-signature-violet p-6 text-on-signature',
                className,
            )}
        >
            <div className="flex items-start gap-4">
                <span
                    aria-hidden
                    className="flex shrink-0 flex-col items-center leading-none tabular-nums"
                >
                    <span className="text-xs text-on-signature/75 uppercase">
                        {monthShort.format(start)}
                    </span>
                    <span className="mt-1 text-[2.5rem] font-normal">
                        {start.getDate()}
                    </span>
                </span>
                <div className="min-w-0 border-l border-on-signature/20 pl-4">
                    <h2 className="text-xl leading-snug font-normal text-balance">
                        {event.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-on-signature/80 tabular-nums">
                        <time dateTime={event.starts_at}>
                            {longDate.format(start)}
                        </time>
                        {' · '}
                        {formatEventTime(event)}
                    </p>
                    {event.location && (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-on-signature/80">
                            <MapPin aria-hidden className="size-3.5 shrink-0" />
                            {event.location}
                        </p>
                    )}
                    {event.joined && (
                        <p className="mt-2">
                            <JoinedMark onSignature />
                        </p>
                    )}
                </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                    href={eventPage(event)}
                    className={linkClass}
                    aria-label={`${viewLabel}: ${event.title}`}
                >
                    {viewLabel}
                    <ArrowRight aria-hidden className="size-3.5" />
                </Link>
                <Link href="/events" className={linkClass}>
                    See all events
                </Link>
            </div>
        </section>
    );
}
