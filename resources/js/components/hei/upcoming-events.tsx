import { Link } from '@inertiajs/react';
import { ArrowRight, MapPin } from 'lucide-react';
import { useId } from 'react';
import { EventCategoryLabel } from '@/components/hei/event-category';
import { formatEventTime, parseWallClock } from '@/lib/event-dates';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types';

const monthShort = new Intl.DateTimeFormat('en-PH', { month: 'short' });

export function EventDateBlock({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    const date = parseWallClock(value);

    return (
        <span
            aria-hidden
            className={cn(
                'flex size-12 shrink-0 flex-col items-center justify-center rounded-[10px] border tabular-nums',
                className,
            )}
        >
            <span className="text-xs leading-none uppercase">
                {monthShort.format(date)}
            </span>
            <span className="mt-0.5 text-lg leading-none">
                {date.getDate()}
            </span>
        </span>
    );
}

export function UpcomingEvents({
    events,
    limit,
    title = 'Upcoming events',
    emptyMessage = 'No upcoming events yet. CHED Regional Office XII posts trainings, campaigns, and deadlines here.',
    showCalendarLink = true,
    className,
}: {
    events: CalendarEvent[];
    limit?: number;
    title?: string;
    emptyMessage?: string;
    showCalendarLink?: boolean;
    className?: string;
}) {
    const titleId = useId();
    const visible = limit ? events.slice(0, limit) : events;

    return (
        <section
            aria-labelledby={titleId}
            className={cn('rounded-[10px] border bg-card', className)}
        >
            <header className="flex items-baseline justify-between gap-3 px-4 pt-4">
                <h2 id={titleId} className="text-base font-medium">
                    {title}
                </h2>
                {showCalendarLink && (
                    <Link
                        href="/events"
                        className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        Calendar
                        <ArrowRight aria-hidden className="size-3.5" />
                    </Link>
                )}
            </header>

            {visible.length === 0 ? (
                <p className="px-4 pt-2 pb-4 text-sm text-muted-foreground">
                    {emptyMessage}
                </p>
            ) : (
                <ol className="divide-y px-4 pt-1 pb-1">
                    {visible.map((event) => (
                        <li key={event.id} className="flex gap-3 py-3">
                            <EventDateBlock value={event.starts_at} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm leading-snug">
                                    {event.title}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                    <span className="sr-only">
                                        {parseWallClock(
                                            event.starts_at,
                                        ).toDateString()}
                                        ,{' '}
                                    </span>
                                    {formatEventTime(event)}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <EventCategoryLabel
                                        category={event.category}
                                    />
                                    {event.location && (
                                        <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin
                                                aria-hidden
                                                className="size-3 shrink-0"
                                            />
                                            <span className="truncate">
                                                {event.location}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
