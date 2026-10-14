import { Link } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { EventCategoryLabel } from '@/components/hei/event-category';
import { EventDateBlock } from '@/components/hei/upcoming-events';
import { certificateDates } from '@/lib/certificate-text';
import { eventPlace, formatEventTime } from '@/lib/event-dates';
import { cn } from '@/lib/utils';
import { show as publicEvent } from '@/routes/public-events';
import type { PublicEvent } from '@/types/events';

/**
 * When it is, as one line: the day and its hours, or a run of days
 * ("October 12–14, 2026"), whose hours the event's page gives.
 */
function eventWhen(event: PublicEvent): string {
    const dates = certificateDates(event.starts_at, event.ends_at);
    const multiDay =
        event.ends_at !== null &&
        event.ends_at.slice(0, 10) !== event.starts_at.slice(0, 10);

    return multiDay ? dates : `${dates} · ${formatEventTime(event)}`;
}

/** What it is, when and where, and whose: under the title of each layout. */
function EventFacts({ event }: { event: PublicEvent }) {
    return (
        <>
            <p className="text-sm text-muted-foreground tabular-nums">
                {eventWhen(event)}
            </p>
            {event.location && (
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0 break-words">
                        {event.location}
                    </span>
                </p>
            )}
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                <EventCategoryLabel
                    category={event.category}
                    className="text-[13px]"
                />
                <span className="text-muted-foreground">
                    {eventPlace(event.region)}
                </span>
            </p>
        </>
    );
}

function EventTitle({ event }: { event: PublicEvent }) {
    return (
        <Link
            href={publicEvent(event)}
            className="rounded-sm font-medium text-pretty text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            {event.title}
        </Link>
    );
}

/** One event on the public Events page's list: a row on hairlines. */
export function PublicEventRow({ event }: { event: PublicEvent }) {
    return (
        <li className="flex gap-4 px-4 py-4 sm:px-5">
            <EventDateBlock value={event.starts_at} className="bg-card" />
            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <EventTitle event={event} />
                    <EventStatusBadge status={event.status} />
                </div>
                <EventFacts event={event} />
            </div>
        </li>
    );
}

/** One event in the homepage's strip: a card. */
export function PublicEventCard({
    event,
    className,
}: {
    event: PublicEvent;
    className?: string;
}) {
    return (
        <article
            className={cn(
                'flex flex-col gap-3 rounded-xl border bg-card p-5',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <EventDateBlock value={event.starts_at} />
                <EventStatusBadge status={event.status} />
            </div>
            <h3 className="text-base leading-snug">
                <EventTitle event={event} />
            </h3>
            <div className="space-y-1">
                <EventFacts event={event} />
            </div>
        </article>
    );
}
