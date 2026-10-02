<?php

namespace App\Services;

use App\Enums\FeedbackType;
use App\Models\SiteFeedback;
use App\Support\FeedbackQuestions;
use Illuminate\Database\Eloquent\Builder;

/**
 * The figures above the website feedback list: how much arrived, of which
 * type, and how the rated questions were answered. Counted in SQL, in two
 * queries, whatever the volume.
 */
class SiteFeedbackSummary
{
    /**
     * @param  Builder<SiteFeedback>  $scope  the feedback in view (reach, place and search), before the type filter
     * @return array{
     *     total: int,
     *     with_contact: int,
     *     types: list<array{code: string, label: string, count: int}>,
     *     scores: array<string, array{average: float|null, answers: int, counts: list<int>}>,
     *     scales: array<string, float|null>
     * }
     */
    public function for(Builder $scope, ?FeedbackType $type): array
    {
        // By type over everything else in view, so each type's share shows
        // even while one is chosen.
        $byType = (clone $scope)->toBase()
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $columns = FeedbackQuestions::columns();
        $select = [
            'count(*) as total',
            'sum(case when email is not null or name is not null then 1 else 0 end) as with_contact',
        ];
        // Column names come from FeedbackQuestions, never from input.
        foreach ($columns as $column => $max) {
            $select[] = "count({$column}) as {$column}__answers";
            $select[] = "sum({$column}) as {$column}__sum";
            foreach ([1, 2, 3, 4, 5] as $value) {
                if ($value <= $max) {
                    $select[] = "sum(case when {$column} = {$value} then 1 else 0 end) as {$column}__{$value}";
                }
            }
        }
        $row = (array) (clone $scope)->toBase()
            ->when($type !== null, fn ($query) => $query->where('type', $type?->value))
            ->selectRaw(implode(', ', $select))
            ->first();

        $scores = [];
        foreach ($columns as $column => $max) {
            $answers = (int) ($row["{$column}__answers"] ?? 0);
            $scores[$column] = [
                'average' => $answers > 0 ? round((int) $row["{$column}__sum"] / $answers, 1) : null,
                'answers' => $answers,
                'counts' => array_map(fn (int $value): int => (int) ($row["{$column}__{$value}"] ?? 0), range(1, $max)),
            ];
        }

        // Each scale's average over all of its answers, not of its averages.
        $scales = [];
        foreach (FeedbackQuestions::SCALES as $key => $scale) {
            $sum = 0;
            $answers = 0;
            foreach (array_keys($scale['items']) as $item) {
                $sum += (int) ($row["{$item}__sum"] ?? 0);
                $answers += $scores[$item]['answers'];
            }
            $scales[$key] = $answers > 0 ? round($sum / $answers, 1) : null;
        }

        return [
            'total' => (int) ($row['total'] ?? 0),
            'with_contact' => (int) ($row['with_contact'] ?? 0),
            'types' => array_map(fn (array $option): array => [
                ...$option,
                'count' => (int) ($byType[$option['code']] ?? 0),
            ], FeedbackType::options()),
            'scores' => $scores,
            'scales' => $scales,
        ];
    }
}
