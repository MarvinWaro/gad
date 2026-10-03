<?php

use App\Enums\StudentCountKind;
use App\Models\AcademicYear;
use App\Models\DisciplineGroup;
use App\Models\StudentCount;
use App\Models\SurveyRegion;
use App\Support\StudentStatistics;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

/** @param  array<string, array{0: int, 1: int}>  $groups  name => [male, female] */
function homepageCounts(SurveyRegion $region, StudentCountKind $kind, string $year, array $groups): void
{
    foreach ($groups as $name => [$male, $female]) {
        StudentCount::query()->create([
            'kind' => $kind,
            'survey_region_id' => $region->id,
            'academic_year_id' => AcademicYear::query()->where('label', $year)->value('id'),
            'discipline_group_id' => DisciplineGroup::query()->where('name', $name)->value('id'),
            'male' => $male,
            'female' => $female,
        ]);
    }
}

test('the homepage statistics add up every region by year and discipline group', function () {
    $this->travelTo(CarbonImmutable::parse('2026-10-03 09:00:00', 'Asia/Manila'));
    $xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $xi = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    homepageCounts($xii, StudentCountKind::Enrollment, '2025-2026', ['Maritime' => [2558, 104], 'Engineering' => [8134, 4698]]);
    homepageCounts($xi, StudentCountKind::Enrollment, '2025-2026', ['Engineering' => [6, 4]]);
    homepageCounts($xii, StudentCountKind::Graduates, '2024-2025', ['Engineering' => [1230, 687]]);

    $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
        ->component('welcome')
        ->where('statistics.datasets', [
            [
                'year' => '2025-2026',
                // CHED's order, not the file's.
                'enrollment' => [
                    ['program' => 'Engineering', 'male' => 8140, 'female' => 4702],
                    ['program' => 'Maritime', 'male' => 2558, 'female' => 104],
                ],
                'graduates' => [],
            ],
            [
                'year' => '2024-2025',
                'enrollment' => [],
                'graduates' => [['program' => 'Engineering', 'male' => 1230, 'female' => 687]],
            ],
        ])
        ->where('statistics.source.regions', ['Regional Office XII', 'Regional Office XI'])
        ->where('statistics.source.updated_at', '2026-10-03T01:00:00+00:00')
        ->where('statistics.regions', [['id' => $xii->id, 'name' => 'Regional Office XII'], ['id' => $xi->id, 'name' => 'Regional Office XI']])
        ->where('statistics.region', '')
        ->where('statistics.place', null));
});

test('the homepage statistics narrow to a region with figures', function () {
    $xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $xi = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $empty = SurveyRegion::query()->create(['name' => 'Regional Office X', 'is_active' => true]);
    homepageCounts($xii, StudentCountKind::Enrollment, '2025-2026', ['Engineering' => [8134, 4698]]);
    homepageCounts($xi, StudentCountKind::Enrollment, '2025-2026', ['Engineering' => [6, 4]]);
    homepageCounts($xi, StudentCountKind::Graduates, '2023-2024', ['Maritime' => [2, 1]]);

    $this->get(route('home', ['region' => $xi->id]))->assertInertia(fn (Assert $page) => $page
        ->where('statistics.datasets', [
            ['year' => '2025-2026', 'enrollment' => [['program' => 'Engineering', 'male' => 6, 'female' => 4]], 'graduates' => []],
            ['year' => '2023-2024', 'enrollment' => [], 'graduates' => [['program' => 'Maritime', 'male' => 2, 'female' => 1]]],
        ])
        ->where('statistics.source.regions', ['Regional Office XI'])
        ->where('statistics.region', (string) $xi->id)
        ->where('statistics.place', 'Regional Office XI')
        // Every region with figures stays on offer.
        ->has('statistics.regions', 2));

    // A region without figures, or none at all, shows every region.
    foreach ([$empty->id, 999, 'XII'] as $region) {
        $this->get(route('home', ['region' => $region]))->assertInertia(fn (Assert $page) => $page
            ->where('statistics.region', '')
            ->where('statistics.datasets.0.enrollment.0.male', 8140));
    }
});

test('a partial reload sends only the statistics, and imports refresh every region\'s copy', function () {
    $xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    homepageCounts($xii, StudentCountKind::Enrollment, '2025-2026', ['Engineering' => [10, 5]]);

    $this->get(route('home', ['region' => $xii->id]))->assertInertia(fn (Assert $page) => $page
        ->reloadOnly('statistics', fn (Assert $reload) => $reload
            ->where('statistics.place', 'Regional Office XII')
            ->missing('stories')));
    expect(Cache::has(StudentStatistics::homepageCacheKey($xii->id)))->toBeTrue();

    StudentStatistics::flush();

    expect(Cache::has(StudentStatistics::homepageCacheKey($xii->id)))->toBeFalse()
        ->and(Cache::has(StudentStatistics::homepageCacheKey(null)))->toBeFalse();
});

test('the homepage statistics are empty until figures are imported', function () {
    $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
        ->where('statistics', ['datasets' => [], 'source' => ['regions' => [], 'updated_at' => null], 'regions' => [], 'region' => '', 'place' => null]));
});
