import { Link } from '@inertiajs/react';
import { CalendarX2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatEventTime } from '@/lib/event-dates';
import { eventStatus } from '@/lib/scanner';
import type { EventStatus } from '@/lib/scanner';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { index as eventsIndex } from '@/routes/admin/events';
import type { ActivityTone } from '@/types/activity';
import type { ScannerEvent } from '@/types/scanner';

const statuses: Record<EventStatus, { label: string; tone: ActivityTone }> = {
    ongoing: { label: 'Ongoing', tone: 'positive' },
    later: { label: 'Later today', tone: 'info' },
    ended: { label: 'Ended', tone: 'neutral' },
};

/** Where one of today's events stands: under way, still to come, or over. */
function EventStatusBadge({ status }: { status: EventStatus }) {
    return (
        <span
            className={cn(
                'shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium',
                tones[statuses[status].tone].badge,
            )}
        >
            {statuses[status].label}
        </span>
    );
}

/** When, where and for whom, under the event's title. */
function eventDetails(event: ScannerEvent): string {
    return [
        formatEventTime(event),
        event.location,
        event.region ?? 'All regions',
    ]
        .filter(Boolean)
        .join(' · ');
}

/**
 * The event people are checked in to: one of today's, since check-in is
 * open only on an event's own days. `now` is Philippine wall-clock time.
 */
export function EventPicker({
    events,
    value,
    now,
    canViewEvents,
    onChange,
}: {
    events: ScannerEvent[];
    value: number | null;
    now: string;
    /** Links the empty state to Events. */
    canViewEvents: boolean;
    onChange: (event: number) => void;
}) {
    const selected = events.find((event) => event.id === value) ?? null;

    if (events.length === 0) {
        return (
            <div className="grid gap-2">
                <p className="text-sm font-medium">Event</p>
                <div className="flex min-h-11 items-start gap-3 rounded-[10px] border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                    <CalendarX2
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0"
                    />
                    <p>
                        No GAD events today. People can be checked in on an
                        event&apos;s own days.{' '}
                        {canViewEvents && (
                            <Link
                                href={eventsIndex()}
                                className="font-medium text-foreground underline underline-offset-4"
                            >
                                See events
                            </Link>
                        )}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid min-w-0 gap-2">
            <Label htmlFor="scanner-event">Event</Label>
            <Select
                value={selected ? String(selected.id) : ''}
                onValueChange={(next) => onChange(Number(next))}
            >
                <SelectTrigger
                    id="scanner-event"
                    className="h-11 w-full min-w-0 rounded-[10px]"
                >
                    <SelectValue placeholder="Pick today's event">
                        {selected && (
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate">
                                    {selected.title}
                                </span>
                                <EventStatusBadge
                                    status={eventStatus(selected, now)}
                                />
                            </span>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-[10px] shadow-lg">
                    {events.map((event) => (
                        <SelectItem
                            key={event.id}
                            value={String(event.id)}
                            className="py-2"
                        >
                            <span className="flex min-w-0 flex-col items-start gap-0.5">
                                <span className="flex items-center gap-2 font-medium">
                                    {event.title}
                                    <EventStatusBadge
                                        status={eventStatus(event, now)}
                                    />
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {eventDetails(event)}
                                </span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {selected && (
                <p className="text-xs text-muted-foreground">
                    {eventDetails(selected)}
                </p>
            )}
        </div>
    );
}
