import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
    EventCategoryDot,
    EventCategoryLabel,
} from '@/components/hei/event-category';
import { Button } from '@/components/ui/button';
import {
    dateKey,
    eventDayKeys,
    formatEventTime,
    monthKey,
    parseMonthKey,
    parseWallClock,
} from '@/lib/event-dates';
import { cn } from '@/lib/utils';
import type { CalendarEvent, CalendarMonth } from '@/types';

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthTitle = new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    year: 'numeric',
});
const dayTitle = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
});

export function EventCalendar({
    calendar,
    size = 'compact',
    reload = ['calendar'],
    className,
}: {
    calendar: CalendarMonth;
    size?: 'compact' | 'large';
    /** Page props that depend on the month and reload with it. */
    reload?: string[];
    className?: string;
}) {
    const titleId = useId();
    const first = useMemo(
        () => parseMonthKey(calendar.month),
        [calendar.month],
    );
    const [selected, setSelected] = useState(() =>
        calendar.today.startsWith(calendar.month)
            ? calendar.today
            : dateKey(first),
    );
    const [loading, setLoading] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const eventsByDay = useMemo(() => {
        const days = new Map<string, CalendarEvent[]>();

        for (const event of calendar.events) {
            for (const key of eventDayKeys(event)) {
                days.set(key, [...(days.get(key) ?? []), event]);
            }
        }

        return days;
    }, [calendar.events]);

    const cells = useMemo(() => {
        const leading = first.getDay();
        const daysInMonth = new Date(
            first.getFullYear(),
            first.getMonth() + 1,
            0,
        ).getDate();

        const days: Array<Date | null> = [
            ...Array.from({ length: leading }, () => null),
            ...Array.from(
                { length: daysInMonth },
                (_, index) =>
                    new Date(first.getFullYear(), first.getMonth(), index + 1),
            ),
        ];

        while (days.length % 7 !== 0) {
            days.push(null);
        }

        return Array.from({ length: days.length / 7 }, (_, week) =>
            days.slice(week * 7, week * 7 + 7),
        );
    }, [first]);

    const selectedInMonth = selected.startsWith(calendar.month)
        ? selected
        : dateKey(first);
    const selectedEvents = eventsByDay.get(selectedInMonth) ?? [];

    function goToMonth(offset: number) {
        const target = new Date(
            first.getFullYear(),
            first.getMonth() + offset,
            1,
        );
        const key = monthKey(target);

        router.get(
            window.location.pathname,
            { month: key },
            {
                only: reload,
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
                onSuccess: () =>
                    setSelected(
                        calendar.today.startsWith(key)
                            ? calendar.today
                            : dateKey(target),
                    ),
            },
        );
    }

    function focusDay(key: string) {
        setSelected(key);
        requestAnimationFrame(() =>
            gridRef.current
                ?.querySelector<HTMLButtonElement>(`[data-day="${key}"]`)
                ?.focus(),
        );
    }

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        const steps: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -7,
            ArrowDown: 7,
        };
        const step = steps[event.key];

        if (step === undefined) {
            return;
        }

        event.preventDefault();
        const current = parseWallClock(`${selectedInMonth}T00:00:00`);
        current.setDate(current.getDate() + step);

        if (monthKey(current) === calendar.month) {
            focusDay(dateKey(current));
        }
    }

    const large = size === 'large';

    return (
        <section
            aria-labelledby={titleId}
            className={cn('rounded-[10px] border bg-card', className)}
        >
            <header className="flex items-center justify-between gap-2 px-4 pt-4">
                <h2
                    id={titleId}
                    className="text-base font-medium"
                    aria-live="polite"
                >
                    {monthTitle.format(first)}
                </h2>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-full shadow-none"
                        onClick={() => goToMonth(-1)}
                        aria-label="Previous month"
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-full shadow-none"
                        onClick={() => goToMonth(1)}
                        aria-label="Next month"
                    >
                        <ChevronRight />
                    </Button>
                </div>
            </header>

            <div
                ref={gridRef}
                role="grid"
                aria-labelledby={titleId}
                aria-busy={loading}
                className={cn(
                    'grid grid-cols-7 gap-y-1 px-3 pt-3 pb-2 transition-opacity duration-150',
                    loading && 'opacity-50',
                )}
            >
                <div role="row" className="contents">
                    {weekdays.map((day) => (
                        <div
                            key={day}
                            role="columnheader"
                            className="pb-1 text-center text-xs text-muted-foreground"
                        >
                            <abbr title={day} className="no-underline">
                                {large ? day : day.slice(0, 2)}
                            </abbr>
                        </div>
                    ))}
                </div>
                {cells.map((week, weekIndex) => (
                    <div key={weekIndex} role="row" className="contents">
                        {week.map((date, index) => {
                            if (!date) {
                                return (
                                    <div
                                        key={`blank-${weekIndex}-${index}`}
                                        role="gridcell"
                                    />
                                );
                            }

                            const key = dateKey(date);
                            const dayEvents = eventsByDay.get(key) ?? [];
                            const isToday = key === calendar.today;
                            const isSelected = key === selectedInMonth;
                            const categories = [
                                ...new Set(
                                    dayEvents.map((event) => event.category),
                                ),
                            ].slice(0, 3);

                            return (
                                <div
                                    key={key}
                                    role="gridcell"
                                    aria-selected={isSelected}
                                    className="flex justify-center"
                                >
                                    <button
                                        type="button"
                                        data-day={key}
                                        tabIndex={isSelected ? 0 : -1}
                                        aria-current={
                                            isToday ? 'date' : undefined
                                        }
                                        aria-label={`${dayTitle.format(date)}${dayEvents.length ? `, ${dayEvents.length} ${dayEvents.length === 1 ? 'event' : 'events'}` : ''}`}
                                        onClick={() => setSelected(key)}
                                        onKeyDown={handleKeyDown}
                                        className={cn(
                                            'relative flex flex-col items-center justify-center rounded-full text-sm tabular-nums transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                            large ? 'size-11' : 'size-9',
                                            isToday
                                                ? 'bg-foreground text-background'
                                                : 'hover:bg-muted',
                                            // An ink hairline marks the chosen day; today keeps
                                            // its ink fill, which already outranks it.
                                            isSelected &&
                                                !isToday &&
                                                'ring-1 ring-foreground ring-inset',
                                        )}
                                    >
                                        {date.getDate()}
                                        {categories.length > 0 && (
                                            <span className="absolute bottom-1 flex gap-0.5">
                                                {categories.map((category) => (
                                                    <EventCategoryDot
                                                        key={category}
                                                        category={category}
                                                    />
                                                ))}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="border-t px-4 py-3" aria-live="polite">
                <p className="text-sm font-medium">
                    {dayTitle.format(
                        parseWallClock(`${selectedInMonth}T00:00:00`),
                    )}
                </p>
                {selectedEvents.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                        Nothing scheduled.
                    </p>
                ) : (
                    <ul className="mt-2 space-y-3">
                        {selectedEvents.map((event) => (
                            <li key={event.id} className="text-sm">
                                <p className="leading-snug">{event.title}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                    {formatEventTime(event)}
                                </p>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <EventCategoryLabel
                                        category={event.category}
                                    />
                                    {event.location && (
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin
                                                aria-hidden
                                                className="size-3"
                                            />
                                            {event.location}
                                        </span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
