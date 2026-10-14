<?php

namespace App\Concerns;

/**
 * The days someone came to an event, as staff mark them on its list:
 * Philippine days, Y-m-d. Which days the event allows is
 * EventAttendance::ensureDays's to say.
 */
trait EventDaysRules
{
    /**
     * @param  bool  $required  Whether the list must be sent, as when it is all
     *                          the days marked; otherwise none is no days.
     * @return array<string, array<mixed>>
     */
    protected function daysRules(bool $required = true): array
    {
        return [
            'days' => [$required ? 'present' : 'sometimes', 'array', 'max:400'],
            'days.*' => ['string', 'date_format:Y-m-d', 'distinct'],
        ];
    }

    /** @return list<string> */
    public function days(): array
    {
        return array_values(array_map('strval', (array) $this->validated('days', [])));
    }
}
