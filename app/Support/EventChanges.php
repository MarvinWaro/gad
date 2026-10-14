<?php

namespace App\Support;

use Carbon\CarbonImmutable;

/**
 * Which changes to a GAD event its people are told of, and how the notice
 * says them (docs/event-registration.md): its date and time, venue or region.
 * Closing registration, or a new title or description, tells no one.
 */
final class EventChanges
{
    /** The fields that change where, when or for whom the event is. */
    public const NOTIFIED = ['starts_at', 'ends_at', 'is_all_day', 'location', 'survey_region_id'];

    /** @param  array<string, mixed>  $changes  field => [before, after], as ActivityRecorder::changesOf keeps them */
    public static function concernPeople(array $changes): bool
    {
        return array_intersect(array_keys($changes), self::NOTIFIED) !== [];
    }

    /**
     * What the event now says, for the notice's quote: "Starts October 20,
     * 2026, 8:00 AM · Venue: Koronadal City". Null when nothing they are
     * told of changed.
     *
     * @param  array<string, mixed>  $changes
     */
    public static function summary(array $changes): ?string
    {
        $parts = [];

        foreach (['starts_at' => 'Starts', 'ends_at' => 'Ends'] as $field => $label) {
            if (array_key_exists($field, $changes)) {
                $value = self::after($changes, $field);
                $parts[] = $value !== null ? $label.' '.self::moment($value) : "{$label} with its first day";
            }
        }

        if (array_key_exists('location', $changes)) {
            $parts[] = 'Venue: '.(self::after($changes, 'location') ?? 'none given');
        }

        if (array_key_exists('survey_region_id', $changes)) {
            $parts[] = 'Now for '.(self::after($changes, 'survey_region_id') ?? 'every region');
        }

        return $parts === [] ? null : implode(' · ', $parts);
    }

    /** @param  array<string, mixed>  $changes */
    private static function after(array $changes, string $field): ?string
    {
        $value = is_array($changes[$field]) ? ($changes[$field][1] ?? null) : null;

        return is_scalar($value) && $value !== '' ? (string) $value : null;
    }

    /**
     * An event time as people read it. Event times are Philippine wall-clock
     * times, logged with a "Z" they don't mean; a whole day (an all-day
     * event's bounds) is just its date.
     */
    private static function moment(string $value): string
    {
        $time = CarbonImmutable::parse(substr($value, 0, 19));

        return in_array($time->format('H:i:s'), ['00:00:00', '23:59:59'], true)
            ? $time->format('F j, Y')
            : $time->format('F j, Y, g:i A');
    }
}
