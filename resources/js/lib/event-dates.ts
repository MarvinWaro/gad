import type { CalendarEvent, EventCategory } from '@/types';

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
export function formatEventTime(event: CalendarEvent): string {
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
