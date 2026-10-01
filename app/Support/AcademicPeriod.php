<?php

namespace App\Support;

use App\Models\AcademicYear;
use App\Models\ChecklistResponse;
use App\Models\GadEvent;
use App\Models\MonitoringReport;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Philippine academic years and semesters. The first semester runs from
 * August to December; January to July belongs to the second semester of the
 * year that began the August before.
 */
class AcademicPeriod
{
    /** The earliest academic year an HEI can report on. */
    public const FIRST_YEAR = 2020;

    public const SEMESTERS = [1, 2];

    /** @return array{academic_year: string, semester: int} */
    public static function current(?CarbonInterface $at = null): array
    {
        $today = ($at ?? CarbonImmutable::now())->toImmutable()->setTimezone(GadEvent::TIMEZONE);

        return $today->month >= 8
            ? ['academic_year' => self::label($today->year), 'semester' => 1]
            : ['academic_year' => self::label($today->year - 1), 'semester' => 2];
    }

    /**
     * The academic years an HEI may report on, newest first: next year's,
     * then back to the first the system keeps.
     *
     * @return list<string>
     */
    public static function calendarOptions(?CarbonInterface $at = null): array
    {
        $current = (int) substr(self::current($at)['academic_year'], 0, 4);

        return array_map(self::label(...), range($current + 1, self::FIRST_YEAR));
    }

    /** @return list<string> */
    public static function options(): array
    {
        return array_values(AcademicYear::query()->where('is_active', true)
            ->orderByDesc('start_year')->get(['label'])
            ->map(fn (AcademicYear $year): string => $year->label)
            ->all());
    }

    /**
     * Include years already used by records even if they are now inactive.
     *
     * @return list<string>
     */
    public static function recordOptions(): array
    {
        return array_values(collect(self::options())
            ->merge(MonitoringReport::query()->distinct()->get(['academic_year'])
                ->map(fn (MonitoringReport $report): string => $report->academic_year))
            ->merge(ChecklistResponse::query()->distinct()->get(['academic_year'])
                ->map(fn (ChecklistResponse $response): string => $response->academic_year))
            ->unique()->sortDesc()->all());
    }

    /** 2026 → "2026-2027" */
    public static function label(int $startYear): string
    {
        return $startYear.'-'.($startYear + 1);
    }
}
