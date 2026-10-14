<?php

namespace App\Support;

use App\Models\GadEvent;
use Illuminate\Validation\ValidationException;

/**
 * When staff may keep an event's list by hand, people and guests alike
 * (docs/event-registration.md): never at a deadline, which nobody attends,
 * or at a cancelled event, and only on the event's own days up to today.
 */
final class EventAttendance
{
    /** @throws ValidationException */
    public static function ensureListKept(GadEvent $event): void
    {
        $problem = match (true) {
            $event->category === 'deadline' => __('Deadlines have no list of who joined.'),
            $event->isCancelled() => __(':event was cancelled. Restore it first.', ['event' => $event->title]),
            default => null,
        };

        if ($problem !== null) {
            throw ValidationException::withMessages(['registration' => $problem]);
        }
    }

    /**
     * The days staff may mark: the event's own, up to today.
     *
     * @return list<string> Y-m-d
     */
    public static function markableDays(GadEvent $event): array
    {
        $today = GadEvent::localNow()->toDateString();

        return array_values(array_filter($event->days(), fn (string $day): bool => $day <= $today));
    }

    /**
     * @param  list<string>  $days
     *
     * @throws ValidationException
     */
    public static function ensureDays(GadEvent $event, array $days): void
    {
        if (array_diff($days, self::markableDays($event)) !== []) {
            throw ValidationException::withMessages([
                'days' => __('Mark only the days of :event, up to today.', ['event' => $event->title]),
            ]);
        }
    }
}
