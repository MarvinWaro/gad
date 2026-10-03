<?php

namespace App\Actions\Statistics;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\StudentCountKind;
use App\Models\AcademicYear;
use App\Models\DisciplineGroup;
use App\Models\StudentCount;
use App\Models\SurveyRegion;
use App\Services\ActivityRecorder;
use App\Services\StudentCountSheet;
use App\Support\ActivityPlace;
use App\Support\StudentStatistics;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Saves a region's enrollment or graduate counts, a whole academic year at a
 * time: each year the rows name replaces what the region had for it. The
 * Settings import uses it, and a future /api/v1 endpoint can send the same
 * rows. See docs/enrollment-and-graduates.md.
 */
class ReplaceStudentCounts
{
    /** Short words kept lower case when an all-caps name is title-cased. */
    private const MINOR_WORDS = ['a', 'an', 'and', 'for', 'in', 'of', 'on', 'or', 'the', 'to'];

    public function __construct(private readonly ActivityRecorder $activity) {}

    /**
     * @param  list<array{row: int, group: string, male: int, female: int, academic_year: string}>  $rows
     * @return array{academic_years: list<string>, groups: int, new_groups: list<string>}
     */
    public function import(StudentCountKind $kind, SurveyRegion $region, array $rows, ?string $source = null): array
    {
        $years = AcademicYear::query()
            ->whereIn('label', array_unique(array_column($rows, 'academic_year')))
            ->get(['id', 'label', 'start_year'])
            ->keyBy('label');
        $groups = DisciplineGroup::query()->orderBy('sort_order')->get(['id', 'name', 'sort_order']);
        $keys = $groups->mapWithKeys(fn (DisciplineGroup $group): array => [DisciplineGroup::keyOf($group->name) => $group]);

        $problems = [];
        $missingYears = [];
        $seen = [];
        /** @var array<string, string> $newNames key => name */
        $newNames = [];
        $resolved = [];

        foreach ($rows as $row) {
            if (! $years->has($row['academic_year'])) {
                if (! isset($missingYears[$row['academic_year']])) {
                    $missingYears[$row['academic_year']] = true;
                    $problems[] = __('Row :row: AY :year is not in Settings → Academic years. Add it there first.', ['row' => $row['row'], 'year' => $row['academic_year']]);
                }

                continue;
            }

            $key = $this->matchKey(DisciplineGroup::keyOf($row['group']), $keys);
            if ($key === '') {
                $problems[] = __('Row :row: the discipline group needs letters or numbers.', ['row' => $row['row']]);

                continue;
            }

            if (! $keys->has($key)) {
                $newNames[$key] ??= $this->nameFor($row['group']);
            }

            if (isset($seen[$row['academic_year']][$key])) {
                $problems[] = __('Row :row: :group is listed twice for AY :year.', ['row' => $row['row'], 'group' => $row['group'], 'year' => $row['academic_year']]);

                continue;
            }

            $seen[$row['academic_year']][$key] = true;
            $resolved[] = [...$row, 'key' => $key];
        }

        if ($problems !== []) {
            throw StudentCountSheet::invalid($problems);
        }

        DB::transaction(function () use ($kind, $region, $years, $resolved, $newNames, $keys): void {
            $order = (int) DisciplineGroup::query()->max('sort_order');
            foreach ($newNames as $key => $name) {
                $keys[$key] = DisciplineGroup::query()->create(['name' => $name, 'sort_order' => ++$order]);
            }

            $now = now();
            foreach (collect($resolved)->groupBy('academic_year') as $label => $yearRows) {
                $yearId = $years[$label]->id;
                StudentCount::query()
                    ->where('kind', $kind)
                    ->where('survey_region_id', $region->id)
                    ->where('academic_year_id', $yearId)
                    ->delete();
                StudentCount::query()->insert($yearRows->map(fn (array $row): array => [
                    'kind' => $kind->value,
                    'survey_region_id' => $region->id,
                    'academic_year_id' => $yearId,
                    'discipline_group_id' => $keys[$row['key']]->id,
                    'male' => $row['male'],
                    'female' => $row['female'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all());
            }
        });

        $labels = $years->sortByDesc('start_year')->keys()->all();
        $result = [
            'academic_years' => array_values(array_map('strval', $labels)),
            'groups' => count($resolved),
            'new_groups' => array_values($newNames),
        ];

        $this->activity->record(
            ActivityAction::Imported,
            ActivityModule::StudentCounts,
            properties: array_filter([
                'kind' => $kind->value,
                'academic_years' => $result['academic_years'],
                'rows' => $result['groups'],
                'new_groups' => $result['new_groups'],
                'file' => $source,
            ], fn (mixed $value): bool => $value !== null && $value !== []),
            label: $this->label($kind, $result['academic_years'], $region),
            place: new ActivityPlace(region: $region->id),
        );
        StudentStatistics::flush();

        return $result;
    }

    /** Removes a region's figures of one kind for one academic year. */
    public function delete(StudentCountKind $kind, SurveyRegion $region, AcademicYear $year): int
    {
        $deleted = StudentCount::query()
            ->where('kind', $kind)
            ->where('survey_region_id', $region->id)
            ->whereBelongsTo($year)
            ->delete();

        if ($deleted > 0) {
            $this->activity->record(
                ActivityAction::Deleted,
                ActivityModule::StudentCounts,
                properties: ['kind' => $kind->value, 'academic_year' => $year->label, 'rows' => $deleted],
                label: $this->label($kind, [$year->label], $region),
                place: new ActivityPlace(region: $region->id),
            );
            StudentStatistics::flush();
        }

        return $deleted;
    }

    /**
     * Such as "AY 2025-2026 enrollment for Regional Office XII".
     *
     * @param  list<string>  $years
     */
    public function label(StudentCountKind $kind, array $years, SurveyRegion $region): string
    {
        return __(':years :kind for :region', [
            'years' => 'AY '.implode(', ', $years),
            'kind' => Str::lower($kind->label()),
            'region' => $region->name,
        ]);
    }

    /**
     * The group a name means: the same words, or else the one group whose
     * name starts with them, so the old system's short names ("Agricultural",
     * "Criminal Justice") join today's groups. Otherwise the name's own key,
     * for a new group.
     *
     * @param  Collection<string, DisciplineGroup>  $keys
     */
    private function matchKey(string $key, Collection $keys): string
    {
        if ($keys->has($key)) {
            return $key;
        }

        $starting = $keys->keys()->filter(fn (string $candidate): bool => str_starts_with($candidate, $key.' '));

        return $starting->count() === 1 ? (string) $starting->first() : $key;
    }

    /** A new group's name as written, or title-cased when written in capitals. */
    private function nameFor(string $name): string
    {
        if ($name !== Str::upper($name)) {
            return $name;
        }

        return collect(explode(' ', Str::lower($name)))
            ->map(fn (string $word, int $index): string => $index > 0 && in_array($word, self::MINOR_WORDS, true) ? $word : Str::ucfirst($word))
            ->implode(' ');
    }
}
