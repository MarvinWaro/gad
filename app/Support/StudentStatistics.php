<?php

namespace App\Support;

use App\Enums\StudentCountKind;
use App\Models\AcademicYear;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Enrollment and graduates by sex, added up in SQL for the Settings page, the
 * staff dashboard and the homepage. A null region means every region. The
 * figures are regional totals, so they never narrow to an HEI.
 *
 * @phpstan-type GroupFigures array{id: int, name: string, male: int, female: int}
 * @phpstan-type YearFigures array{id: string, label: string, start_year: int, male: int, female: int, groups: int, regions: int, imported_at: string|null}
 */
final class StudentStatistics
{
    public const HOMEPAGE_CACHE_SECONDS = 600;

    /**
     * The years with figures, newest first.
     *
     * @return list<YearFigures>
     */
    public static function years(StudentCountKind $kind, ?int $regionId): array
    {
        return array_values(self::counts($kind, $regionId)
            ->join('academic_years as ay', 'ay.id', '=', 'sc.academic_year_id')
            ->groupBy('ay.id', 'ay.label', 'ay.start_year')
            ->orderByDesc('ay.start_year')
            ->selectRaw('ay.id, ay.label, ay.start_year, sum(sc.male) as male, sum(sc.female) as female, count(distinct sc.discipline_group_id) as group_count, count(distinct sc.survey_region_id) as regions, max(sc.updated_at) as imported_at')
            ->get()
            ->map(fn (object $year): array => [
                'id' => (string) $year->id,
                'label' => (string) $year->label,
                'start_year' => (int) $year->start_year,
                'male' => (int) $year->male,
                'female' => (int) $year->female,
                'groups' => (int) $year->group_count,
                'regions' => (int) $year->regions,
                'imported_at' => self::iso($year->imported_at),
            ])
            ->all());
    }

    /**
     * One year's figures by discipline group, in CHED's order.
     *
     * @return list<GroupFigures>
     */
    public static function groups(StudentCountKind $kind, string $academicYearId, ?int $regionId): array
    {
        return array_values(self::counts($kind, $regionId)
            ->join('discipline_groups as g', 'g.id', '=', 'sc.discipline_group_id')
            ->where('sc.academic_year_id', $academicYearId)
            ->groupBy('g.id', 'g.name', 'g.sort_order')
            ->orderBy('g.sort_order')
            ->orderBy('g.id')
            ->selectRaw('g.id, g.name, sum(sc.male) as male, sum(sc.female) as female')
            ->get()
            ->map(fn (object $group): array => [
                'id' => (int) $group->id,
                'name' => (string) $group->name,
                'male' => (int) $group->male,
                'female' => (int) $group->female,
            ])
            ->all());
    }

    /**
     * The regions that sent one year's figures, in office order.
     *
     * @return list<string>
     */
    public static function regions(StudentCountKind $kind, string $academicYearId, ?int $regionId): array
    {
        return array_values(SurveyRegion::query()
            ->whereIn('id', self::counts($kind, $regionId)->where('sc.academic_year_id', $academicYearId)->select('sc.survey_region_id'))
            ->orderBy('id')
            ->pluck('name')
            ->all());
    }

    /**
     * The Settings page: one kind, place and year, the newest year with
     * figures unless one is asked for.
     *
     * @return array<string, mixed>
     */
    public static function forSettings(StudentCountKind $kind, ?int $regionId, ?string $academicYear): array
    {
        $years = self::years($kind, $regionId);
        $label = $academicYear ?? ($years[0]['label'] ?? AcademicPeriod::current()['academic_year']);
        $year = collect($years)->firstWhere('label', $label);

        return [
            'academic_year' => $label,
            'figures' => $year === null ? null : [
                'male' => $year['male'],
                'female' => $year['female'],
                'imported_at' => $year['imported_at'],
                'groups' => self::groups($kind, $year['id'], $regionId),
                'regions' => self::regions($kind, $year['id'], $regionId),
            ],
            'years' => array_map(fn (array $year): array => [
                'label' => $year['label'],
                'groups' => $year['groups'],
            ], $years),
            // Every year a file may hold, and any year that has figures.
            'academicYears' => array_values(AcademicYear::query()
                ->where('is_active', true)
                ->pluck('label')
                ->merge(array_column($years, 'label'))
                ->push($label)
                ->unique()
                ->sortDesc()
                ->all()),
        ];
    }

    /**
     * The dashboard's section. Each kind shows the newest year with figures
     * up to the year in view, since statistics arrive after a year ends.
     *
     * @return array<string, mixed>
     */
    public static function forDashboard(DashboardScope $scope, ReportingPeriod $period): array
    {
        if ($scope->heisOnly() || ! $scope->hasOffice) {
            return ['heisOnly' => $scope->heisOnly(), 'enrollment' => null, 'graduates' => null];
        }

        $startYear = (int) substr($period->academicYear, 0, 4);
        $figures = ['heisOnly' => false];

        foreach (StudentCountKind::cases() as $kind) {
            $years = collect(self::years($kind, $scope->regionId));
            $year = $years->first(fn (array $year): bool => $year['start_year'] <= $startYear);
            $previous = $year === null ? null : $years->firstWhere('start_year', $year['start_year'] - 1);

            $figures[$kind->value] = $year === null ? null : [
                'academic_year' => $year['label'],
                'latest' => $year['label'] !== $period->academicYear,
                'male' => $year['male'],
                'female' => $year['female'],
                'previous' => $previous === null ? null : [
                    'academic_year' => $previous['label'],
                    'male' => $previous['male'],
                    'female' => $previous['female'],
                ],
                'groups' => self::groups($kind, $year['id'], $scope->regionId),
                'regions' => self::regions($kind, $year['id'], $scope->regionId),
            ];
        }

        return $figures;
    }

    /**
     * The homepage's statistics, by year (newest first) and discipline
     * group: one region's, or every region added up. A region without
     * figures gives every region's. `regions` lists the regions to choose
     * from: those with figures, in office order.
     *
     * @return array{datasets: list<array{year: string, enrollment: list<array{program: string, male: int, female: int}>, graduates: list<array{program: string, male: int, female: int}>}>, source: array{regions: list<string>, updated_at: string|null}, regions: list<array{id: int, name: string}>, region: string, place: string|null}
     */
    public static function forHomepage(?int $regionId = null): array
    {
        $all = Cache::remember(self::homepageCacheKey(null), self::HOMEPAGE_CACHE_SECONDS, fn (): array => self::homepage(null, array_values(SurveyRegion::query()
            ->whereIn('id', DB::table('student_counts')->select('survey_region_id'))
            ->orderBy('id')
            ->get(['id', 'name'])
            ->map(fn (SurveyRegion $option): array => ['id' => $option->id, 'name' => $option->name])
            ->all())));
        $region = collect($all['regions'])->firstWhere('id', $regionId);

        return $region === null
            ? $all
            : Cache::remember(self::homepageCacheKey($region['id']), self::HOMEPAGE_CACHE_SECONDS, fn (): array => self::homepage($region, $all['regions']));
    }

    public static function homepageCacheKey(?int $regionId): string
    {
        return 'homepage:student-statistics:'.($regionId ?? 'all');
    }

    /** Forget the homepage's copies after an import or delete. */
    public static function flush(): void
    {
        Cache::forget(self::homepageCacheKey(null));
        foreach (SurveyRegion::query()->pluck('id') as $regionId) {
            Cache::forget(self::homepageCacheKey((int) $regionId));
        }
    }

    /**
     * @param  array{id: int, name: string}|null  $region
     * @param  list<array{id: int, name: string}>  $regions
     * @return array{datasets: list<array{year: string, enrollment: list<array{program: string, male: int, female: int}>, graduates: list<array{program: string, male: int, female: int}>}>, source: array{regions: list<string>, updated_at: string|null}, regions: list<array{id: int, name: string}>, region: string, place: string|null}
     */
    private static function homepage(?array $region, array $regions): array
    {
        $place = fn (Builder $query): Builder => $query->when($region, fn (Builder $query) => $query->where('survey_region_id', $region['id'] ?? null));
        $datasets = [];
        $rows = $place(DB::table('student_counts as sc'))
            ->join('academic_years as ay', 'ay.id', '=', 'sc.academic_year_id')
            ->join('discipline_groups as g', 'g.id', '=', 'sc.discipline_group_id')
            ->groupBy('ay.label', 'ay.start_year', 'sc.kind', 'g.id', 'g.name', 'g.sort_order')
            ->orderByDesc('ay.start_year')
            ->orderBy('g.sort_order')
            ->orderBy('g.id')
            ->selectRaw('ay.label, sc.kind, g.name, sum(sc.male) as male, sum(sc.female) as female')
            ->get();

        foreach ($rows as $row) {
            $year = (string) $row->label;
            $datasets[$year] ??= ['year' => $year, 'enrollment' => [], 'graduates' => []];
            $datasets[$year][StudentCountKind::from((string) $row->kind)->value][] = [
                'program' => (string) $row->name,
                'male' => (int) $row->male,
                'female' => (int) $row->female,
            ];
        }

        return [
            'datasets' => array_values($datasets),
            'source' => [
                'regions' => $region === null ? array_column($regions, 'name') : [$region['name']],
                'updated_at' => self::iso($place(DB::table('student_counts'))->max('updated_at')),
            ],
            'regions' => $regions,
            'region' => $region === null ? '' : (string) $region['id'],
            'place' => $region['name'] ?? null,
        ];
    }

    /** Counts of one kind, as sc, in one region or all of them. */
    private static function counts(StudentCountKind $kind, ?int $regionId): Builder
    {
        return DB::table('student_counts as sc')
            ->where('sc.kind', $kind->value)
            ->when($regionId, fn (Builder $query) => $query->where('sc.survey_region_id', $regionId));
    }

    /** A stored UTC time as ISO 8601. */
    private static function iso(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? CarbonImmutable::parse($value, 'UTC')->toIso8601String() : null;
    }
}
