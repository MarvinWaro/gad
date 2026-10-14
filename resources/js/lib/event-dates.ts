import type { CalendarEvent, EventCategory, EventStatus } from '@/types';

/**
 * Event times arrive as Philippine wall-clock strings (`2026-10-02T09:00:00`)
 * with no offset. Reading the parts directly keeps 9:00 as 9:00 in every
 * browser, whatever its own time zone.
 */
export function parseWallClock(value: string): Date {
    const [date, time = '00:00:00'] = value.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes, seconds || 0);
}

export function dateKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

export function monthKey(date: Date): string {
    return dateKey(date).slice(0, 7);
}

export function parseMonthKey(value: string): Date {
    const [year, month] = value.split('-').map(Number);

    return new Date(year, month - 1, 1);
}

/** Every calendar day an event touches, capped so a runaway range stays cheap. */
export function eventDayKeys(event: CalendarEvent): string[] {
    const start = parseWallClock(event.starts_at);
    const end = event.ends_at ? parseWallClock(event.ends_at) : start;
    const keys: string[] = [];
    const cursor = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
    );

    while (cursor <= end && keys.length < 62) {
        keys.push(dateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return keys.length > 0 ? keys : [dateKey(start)];
}

const dayFormat = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
});

/** "All day", "9:00 AM – 4:00 PM", or "Nov 25 – Dec 12" for multi-day events. */
export function formatEventTime(
    event: Pick<CalendarEvent, 'starts_at' | 'ends_at' | 'is_all_day'>,
): string {
    const start = parseWallClock(event.starts_at);
    const end = event.ends_at ? parseWallClock(event.ends_at) : null;
    const multiDay = end !== null && dateKey(start) !== dateKey(end);

    if (multiDay) {
        return event.is_all_day
            ? `${dayFormat.format(start)} – ${dayFormat.format(end)}`
            : `${dayFormat.format(start)}, ${timeFormat.format(start)} – ${dayFormat.format(end)}, ${timeFormat.format(end)}`;
    }

    if (event.is_all_day) {
        return 'All day';
    }

    return end
        ? `${timeFormat.format(start)} – ${timeFormat.format(end)}`
        : timeFormat.format(start);
}

const longDay = new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
});

/** A wall-clock moment as a sentence names it: "October 20, 5:00 PM". */
export function formatMoment(value: string): string {
    const date = parseWallClock(value);

    return `${longDay.format(date)}, ${timeFormat.format(date)}`;
}

/** What an event's page says about joining it, by where registration stands. */
export function registrationNote(event: {
    registration_closes_at: string | null;
    registration_open: boolean;
    ended: boolean;
    cancelled?: boolean;
}): string {
    if (event.cancelled) {
        return 'This event was cancelled.';
    }

    if (event.ended) {
        return 'This event has ended.';
    }

    if (event.registration_open) {
        return event.registration_closes_at
            ? `Registration closes ${formatMoment(event.registration_closes_at)}.`
            : 'Registration is open until the event ends.';
    }

    return event.registration_closes_at
        ? `Registration closed ${formatMoment(event.registration_closes_at)}.`
        : 'Registration is closed.';
}

/** Whose event it is: "For Regional Office XII", or "For every region". */
export function eventPlace(region: string | null): string {
    return region ? `For ${region}` : 'For every region';
}

/** How each status reads, in its tone (`lib/tones.ts`). */
export const eventStatuses: Record<
    EventStatus,
    { label: string; tone: 'positive' | 'info' | 'neutral' | 'danger' }
> = {
    ongoing: { label: 'Happening now', tone: 'positive' },
    upcoming: { label: 'Upcoming', tone: 'info' },
    ended: { label: 'Ended', tone: 'neutral' },
    cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const eventCategories: Record<
    EventCategory,
    { label: string; dot: string }
> = {
    training: { label: 'Training', dot: 'bg-brand' },
    campaign: { label: 'Campaign', dot: 'bg-signature-red' },
    deadline: { label: 'Deadline', dot: 'bg-signature-mustard' },
    meeting: { label: 'Meeting', dot: 'bg-foreground' },
    other: { label: 'Event', dot: 'bg-muted-foreground' },
};
