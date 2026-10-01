<?php

use App\Support\AcademicPeriod;
use Carbon\CarbonImmutable;

test('the current period follows the Philippine semester calendar', function (string $utc, string $year, int $semester) {
    expect(AcademicPeriod::current(CarbonImmutable::parse($utc, 'UTC')))
        ->toBe(['academic_year' => $year, 'semester' => $semester]);
})->with([
    'September' => ['2026-09-29 02:00:00', '2026-2027', 1],
    'December' => ['2026-12-31 10:00:00', '2026-2027', 1],
    'January' => ['2027-01-05 00:00:00', '2026-2027', 2],
    'July' => ['2027-07-31 12:00:00', '2026-2027', 2],
    // 31 July, 16:00 UTC is already 1 August in Manila.
    'August in Manila, still July in UTC' => ['2027-07-31 16:00:00', '2027-2028', 1],
]);

test('options run from next academic year back to the first one kept', function () {
    $options = AcademicPeriod::calendarOptions(CarbonImmutable::parse('2026-09-29 02:00:00', 'UTC'));

    expect($options[0])->toBe('2027-2028')
        ->and($options[1])->toBe('2026-2027')
        ->and(end($options))->toBe('2020-2021')
        ->and($options)->toHaveCount(8);
});
