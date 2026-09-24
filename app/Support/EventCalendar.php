<?php

namespace App\Support;

use App\Models\GadEvent;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Month and upcoming views of regional GAD events, in Philippine wall-clock
 * time (see GadEvent::TIMEZONE).
 */
class EventCalendar
{
    /**
     * The events of one month, keyed for the calendar grid.
     *
     * @return array{month: string, today: string, events: array<int, array<string, mixed>>}
     */
    public static function month(?string $month): array
    {
        $today = GadEvent::localNow();
        $start = self::resolveMonth($month, $today);
        $end = $start->endOfMonth();

        return [
            'month' => $start->format('Y-m'),
            'today' => $today->toDateString(),
            'events' => GadEvent::query()
                ->between($start, $end)
                ->orderBy('starts_at')
                ->get()
                ->map(fn (GadEvent $event): array => $event->toCalendarArray())
                ->all(),
        ];
    }

    /**
     * Events that have not finished yet, soonest first.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function upcoming(int $limit = 5): array
    {
        $now = GadEvent::localNow();

        return GadEvent::query()
            ->where(fn (Builder $query) => $query
                ->where('starts_at', '>=', $now->startOfDay())
                ->orWhere('ends_at', '>=', $now))
            ->orderBy('starts_at')
            ->limit($limit)
            ->get()
            ->map(fn (GadEvent $event): array => $event->toCalendarArray())
            ->all();
    }

    /**
     * The next events after the given month, so a month view and this list
     * never repeat each other.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function after(?string $month, int $limit = 6): array
    {
        $end = self::resolveMonth($month, GadEvent::localNow())->endOfMonth();

        return GadEvent::query()
            ->where('starts_at', '>', $end)
            ->orderBy('starts_at')
            ->limit($limit)
            ->get()
            ->map(fn (GadEvent $event): array => $event->toCalendarArray())
            ->all();
    }

    /** The first day of the requested `YYYY-MM` month, or of the current one. */
    private static function resolveMonth(?string $month, CarbonImmutable $today): CarbonImmutable
    {
        if ($month !== null && preg_match('/^(\d{4})-(0[1-9]|1[0-2])$/', $month, $parts) === 1) {
            $year = (int) $parts[1];

            if ($year >= 2000 && $year <= 2100) {
                return CarbonImmutable::create($year, (int) $parts[2], 1);
            }
        }

        return $today->startOfMonth();
    }
}
