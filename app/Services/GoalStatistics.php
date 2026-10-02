<?php

namespace App\Services;

use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Support\DashboardScope;
use App\Support\ReportingPeriod;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * How original posts in view spread over a set of goals: the Sustainable
 * Development Goals (post_sdgs) or the A.C.H.I.E.V.E. Agenda (post_achieve_items).
 * A post can carry several goals, so goal counts add up to more than posts.
 *
 * @phpstan-type PlaceRow array{id: int, name: string, kind: string, total: int, counts: array<string, int>}
 * @phpstan-type HeiRank array{id: int, name: string, region: string|null, posts: int}
 * @phpstan-type GoalFigures array{
 *     totals: array{posts: int, covered: int, heis: int},
 *     items: list<array{code: string, posts: int}>,
 *     places: array{level: string|null, rows: list<PlaceRow>},
 *     top_heis: array<string, list<HeiRank>>,
 * }
 */
final class GoalStatistics
{
    /** HEIs a breakdown lists when one region is in view. */
    public const PLACE_ROWS = 10;

    /** HEIs ranked for each goal. */
    public const TOP_HEIS = 5;

    public function __construct(
        private readonly DashboardScope $scope,
        private readonly ReportingPeriod $period,
    ) {}

    /**
     * @param  'post_sdgs'|'post_achieve_items'  $table
     * @param  'sdg'|'item'  $column  the goal's code column in it
     * @param  list<string>  $codes  every goal, in its own order
     * @return GoalFigures
     */
    public function of(string $table, string $column, array $codes): array
    {
        $code = "g.{$column}";
        $counts = $this->tagged($table)->groupBy($code)
            ->selectRaw("{$code} as code, count(*) as posts")
            ->pluck('posts', 'code');
        $totals = $this->tagged($table)
            ->selectRaw("count(distinct p.id) as posts, count(distinct {$code}) as covered, count(distinct p.survey_hei_id) as heis")
            ->first();

        return [
            'totals' => [
                'posts' => (int) ($totals->posts ?? 0),
                'covered' => (int) ($totals->covered ?? 0),
                'heis' => (int) ($totals->heis ?? 0),
            ],
            'items' => array_map(fn (string $item): array => ['code' => $item, 'posts' => (int) ($counts[$item] ?? 0)], $codes),
            'places' => $this->places($table, $code),
            'top_heis' => $this->topHeis($table, $code),
        ];
    }

    /**
     * Original posts in view carrying at least one goal, joined as g.
     *
     * @param  'post_sdgs'|'post_achieve_items'  $table
     */
    private function tagged(string $table): QueryBuilder
    {
        return $this->scope->posts($this->period)->join("{$table} as g", 'g.post_id', '=', 'p.id');
    }

    /**
     * Goals by place, one level below what is in view: regions nationally,
     * a region's top HEIs plus its CHED office, nothing for one HEI.
     *
     * @param  'post_sdgs'|'post_achieve_items'  $table
     * @param  literal-string  $code
     * @return array{level: string|null, rows: list<PlaceRow>}
     */
    private function places(string $table, string $code): array
    {
        if ($this->scope->heiId !== null) {
            return ['level' => null, 'rows' => []];
        }

        if ($this->scope->isNational()) {
            $region = $this->scope->postRegion();
            $rows = $this->rows(
                $this->tagged($table)->whereRaw("{$region} is not null")
                    ->selectRaw("{$region} as place, {$code} as code, count(*) as posts")
                    ->groupByRaw("{$region}, {$code}")
                    ->get(),
                $this->tagged($table)->whereRaw("{$region} is not null")
                    ->selectRaw("{$region} as place, count(distinct p.id) as total")
                    ->groupByRaw($region)
                    ->pluck('total', 'place'),
            );
            // Regions with HEIs list even at zero, so the gaps show too.
            $names = SurveyRegion::query()
                ->where(fn ($query) => $query->whereIn('id', array_keys($rows))
                    ->orWhereHas('clusters.heis', fn ($query) => $query->where('is_active', true)))
                ->orderBy('id')
                ->pluck('name', 'id');

            return ['level' => 'region', 'rows' => array_values($names
                ->map(fn (string $name, int $id): array => ['id' => $id, 'name' => $name, 'kind' => 'region', ...($rows[$id] ?? ['total' => 0, 'counts' => []])])
                ->sortByDesc('total')->all())];
        }

        $totals = $this->tagged($table)->whereNotNull('p.survey_hei_id')
            ->selectRaw('p.survey_hei_id as place, count(distinct p.id) as total')
            ->groupBy('p.survey_hei_id')
            ->orderByDesc('total')->orderBy('place')
            ->limit(self::PLACE_ROWS)
            ->pluck('total', 'place');
        $rows = $this->rows(
            $this->tagged($table)->whereIn('p.survey_hei_id', $totals->keys())
                ->selectRaw("p.survey_hei_id as place, {$code} as code, count(*) as posts")
                ->groupBy('p.survey_hei_id', $code)
                ->get(),
            $totals,
        );
        $names = SurveyHei::query()->whereIn('id', $totals->keys())->pluck('name', 'id');
        $heis = array_values($totals->keys()->map(fn (int|string $id): array => [
            'id' => (int) $id, 'name' => (string) $names->get($id), 'kind' => 'hei', ...$rows[(int) $id],
        ])->all());

        return ['level' => 'hei', 'rows' => [...$heis, ...$this->officeRow($table, $code)]];
    }

    /**
     * The regional office's own posts, as a row beside its HEIs.
     *
     * @param  'post_sdgs'|'post_achieve_items'  $table
     * @param  literal-string  $code
     * @return list<PlaceRow>
     */
    private function officeRow(string $table, string $code): array
    {
        if ($this->scope->regionId === null || $this->scope->heisOnly()) {
            return [];
        }

        $office = fn (): QueryBuilder => $this->tagged($table)->whereNull('p.survey_hei_id');
        $total = (int) $office()->distinct()->count('p.id');

        if ($total === 0) {
            return [];
        }

        return [[
            'id' => $this->scope->regionId,
            'name' => (string) SurveyRegion::query()->whereKey($this->scope->regionId)->value('name'),
            'kind' => 'office',
            'total' => $total,
            'counts' => $office()->groupBy($code)->selectRaw("{$code} as code, count(*) as posts")
                ->pluck('posts', 'code')->map(fn (mixed $posts): int => (int) $posts)->all(),
        ]];
    }

    /**
     * @param  Collection<int, \stdClass>  $counts  place, code, posts
     * @param  Collection<int|string, mixed>  $totals  distinct posts by place
     * @return array<int, array{total: int, counts: array<string, int>}>
     */
    private function rows(Collection $counts, Collection $totals): array
    {
        $rows = [];

        foreach ($totals as $place => $total) {
            $rows[(int) $place] = ['total' => (int) $total, 'counts' => []];
        }
        foreach ($counts as $count) {
            if (isset($rows[(int) $count->place])) {
                $rows[(int) $count->place]['counts'][(string) $count->code] = (int) $count->posts;
            }
        }

        return $rows;
    }

    /**
     * The HEIs with the most posts on each goal, and overall ("all").
     *
     * @param  'post_sdgs'|'post_achieve_items'  $table
     * @param  literal-string  $code
     * @return array<string, list<HeiRank>>
     */
    private function topHeis(string $table, string $code): array
    {
        $ranked = $this->tagged($table)->whereNotNull('p.survey_hei_id')
            ->selectRaw("{$code} as code, p.survey_hei_id as hei, count(*) as posts, row_number() over (partition by {$code} order by count(*) desc, p.survey_hei_id) as position")
            ->groupBy($code, 'p.survey_hei_id');
        $byGoal = DB::query()->fromSub($ranked, 'ranked')
            ->where('position', '<=', self::TOP_HEIS)
            ->orderBy('position')
            ->get();
        $overall = $this->tagged($table)->whereNotNull('p.survey_hei_id')
            ->selectRaw("'all' as code, p.survey_hei_id as hei, count(distinct p.id) as posts")
            ->groupBy('p.survey_hei_id')
            ->orderByDesc('posts')->orderBy('hei')
            ->limit(self::TOP_HEIS)
            ->get();
        $rows = $byGoal->concat($overall);
        $heis = SurveyHei::query()
            ->with('cluster.region:id,name')
            ->whereIn('id', $rows->pluck('hei')->unique())
            ->get(['id', 'name', 'survey_cluster_id'])
            ->keyBy('id');

        return $rows->groupBy(fn (\stdClass $row): string => (string) $row->code)
            ->map(fn (Collection $rows): array => array_values($rows->map(fn (\stdClass $row): array => [
                'id' => (int) $row->hei,
                'name' => (string) $heis->get($row->hei)?->name,
                'region' => $heis->get($row->hei)?->cluster?->region?->name,
                'posts' => (int) $row->posts,
            ])->all()))
            ->all();
    }
}
