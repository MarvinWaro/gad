<?php

namespace App\Services;

use App\Enums\AchieveItem;
use App\Enums\SustainableDevelopmentGoal;
use App\Enums\UserStatus;
use App\Models\GadEvent;
use App\Models\Survey;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\User;
use App\Support\AcademicPeriod;
use App\Support\DashboardScope;
use App\Support\EventCalendar;
use App\Support\PlaceFilters;
use App\Support\ReportingPeriod;
use App\Support\SurveyDefinitions;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * The staff dashboard's figures for the places an account's office covers.
 * Everything is counted in SQL. Survey figures come from the tallies, which
 * outlive the responses (App\Models\SurveyResponseTally). The same payload
 * can serve a future /api/v1/statistics endpoint; see docs/dashboard.md.
 */
class DashboardStatistics
{
    /** How long figures are reused before they are counted again. */
    public const CACHE_SECONDS = 60;

    /** HEIs named as yet to contribute when one region or less is in view. */
    public const WAITING_NAMES = 5;

    /**
     * @param  array<string, mixed>  $filters  validated by DashboardFilterRequest
     * @return array<string, mixed>
     */
    public function for(User $user, array $filters): array
    {
        $period = ReportingPeriod::fromFilters($filters);
        $scope = DashboardScope::for($user, $filters);
        $key = 'dashboard:'.sha1((string) json_encode([$scope->cacheKey(), $period->toArray()]));

        return [
            ...Cache::remember($key, self::CACHE_SECONDS, fn (): array => $this->figures($scope, $period)),
            'filters' => [
                'academic_year' => $period->academicYear,
                'view' => $period->view,
                'semester' => $period->semester === null ? '' : (string) $period->semester,
                'month' => $period->month === null ? '' : (string) $period->month,
                'region' => $user->national_access && $scope->regionId !== null ? (string) $scope->regionId : '',
                'hei' => $scope->heiId === null ? '' : (string) $scope->heiId,
                'ownership' => $scope->ownership ?? '',
                'survey' => $scope->surveyId === null ? '' : (string) $scope->surveyId,
            ],
            'options' => [
                'academicYears' => collect(AcademicPeriod::recordOptions())->push($period->academicYear)->unique()->sortDesc()->values()->all(),
                'surveys' => $this->surveys()->map(fn (Survey $survey): array => ['id' => $survey->id, 'code' => $survey->code])->values()->all(),
                'ownerships' => SurveyHei::OWNERSHIPS,
                ...PlaceFilters::options($user, $filters),
            ],
            'hasOffice' => $user->hasOffice(),
        ];
    }

    /** @return array<string, mixed> */
    private function figures(DashboardScope $scope, ReportingPeriod $period): array
    {
        $goals = new GoalStatistics($scope, $period);

        return [
            'period' => $period->toArray(),
            'scope' => ['label' => $scope->label(), 'national' => $scope->isNational()],
            'kpis' => [
                'responses' => $this->responses($scope, $period),
                'participation' => $this->participation($scope, $period),
                'posts' => $this->posts($scope, $period),
                'accounts' => $this->accounts($scope, $period),
            ],
            'trend' => $this->trend($scope, $period),
            'reach' => $this->reach($scope, $period),
            'laws' => $this->laws($scope, $period),
            'respondents' => $this->respondents($scope, $period),
            'community' => $this->community($scope, $period),
            'goals' => [
                'sdg' => $goals->of('post_sdgs', 'sdg', array_map(
                    fn (SustainableDevelopmentGoal $goal): string => (string) $goal->value,
                    SustainableDevelopmentGoal::cases(),
                )),
                'achieve' => $goals->of('post_achieve_items', 'item', array_map(
                    fn (AchieveItem $item): string => $item->value,
                    AchieveItem::cases(),
                )),
            ],
            'events' => EventCalendar::upcoming(4),
        ];
    }

    /** @return array{value: int, previous: int} */
    private function responses(DashboardScope $scope, ReportingPeriod $period): array
    {
        return [
            'value' => (int) $scope->tallies($period)->sum('t.responses'),
            'previous' => (int) $scope->tallies($period->previous())->sum('t.responses'),
        ];
    }

    /** @return array{participating: int, total: int} */
    private function participation(DashboardScope $scope, ReportingPeriod $period): array
    {
        return [
            'participating' => $this->contributing($scope, $period)->count(),
            'total' => $scope->heis()->count(),
        ];
    }

    /** @return array{value: int, previous: int, tagged: int} */
    private function posts(DashboardScope $scope, ReportingPeriod $period): array
    {
        return [
            'value' => $scope->posts($period)->count(),
            'previous' => $scope->posts($period->previous())->count(),
            'tagged' => $scope->posts($period)
                ->where(fn (QueryBuilder $query) => $query
                    ->whereExists(fn (QueryBuilder $query) => $query->from('post_sdgs')->whereColumn('post_sdgs.post_id', 'p.id'))
                    ->orWhereExists(fn (QueryBuilder $query) => $query->from('post_achieve_items')->whereColumn('post_achieve_items.post_id', 'p.id')))
                ->count(),
        ];
    }

    /** @return array{active: int, pending: int, joined: int, hei: int, ched: int} */
    private function accounts(DashboardScope $scope, ReportingPeriod $period): array
    {
        [$from, $until] = $period->utcBounds();
        $row = $scope->users()->toBase()->selectRaw(
            'sum(case when status = ? then 1 else 0 end) as active, '
            .'sum(case when status = ? then 1 else 0 end) as pending, '
            .'sum(case when status = ? and survey_hei_id is not null then 1 else 0 end) as hei, '
            .'sum(case when created_at >= ? and created_at < ? then 1 else 0 end) as joined',
            [UserStatus::Active->value, UserStatus::Pending->value, UserStatus::Active->value, $from, $until],
        )->first();
        $active = (int) ($row->active ?? 0);
        $hei = (int) ($row->hei ?? 0);

        return [
            'active' => $active,
            'pending' => (int) ($row->pending ?? 0),
            'joined' => (int) ($row->joined ?? 0),
            'hei' => $hei,
            'ched' => $active - $hei,
        ];
    }

    /**
     * Survey responses and original posts per chart point. Responses come
     * from the tallies' Philippine days; posts are counted between each
     * point's UTC bounds (at most twelve indexed counts, cached with the rest).
     *
     * @return list<array{label: string, title: string, responses: int, posts: int}>
     */
    private function trend(DashboardScope $scope, ReportingPeriod $period): array
    {
        $days = $scope->tallies($period)
            ->groupBy('t.date')
            ->selectRaw('t.date as day, sum(t.responses) as responses')
            ->pluck('responses', 'day');

        return array_map(fn (array $bucket): array => [
            'label' => $bucket['label'],
            'title' => $bucket['title'],
            'responses' => (int) $days
                ->filter(fn (mixed $count, string $day): bool => substr($day, 0, 10) >= $bucket['starts_on'] && substr($day, 0, 10) <= $bucket['ends_on'])
                ->sum(),
            'posts' => $scope->posts($period)
                ->where('p.created_at', '>=', CarbonImmutable::parse($bucket['starts_on'], GadEvent::TIMEZONE)->utc())
                ->where('p.created_at', '<', CarbonImmutable::parse($bucket['ends_on'], GadEvent::TIMEZONE)->addDay()->utc())
                ->count(),
        ], $period->buckets());
    }

    /**
     * Active HEIs with at least one survey response in the period.
     *
     * @return Collection<int, int>
     */
    private function contributing(DashboardScope $scope, ReportingPeriod $period): Collection
    {
        return $scope->tallies($period)
            ->join('survey_heis as ph', 'ph.id', '=', 't.survey_hei_id')
            ->where('ph.is_active', true)
            ->where('t.responses', '>', 0)
            ->distinct()
            ->pluck('t.survey_hei_id')
            ->map(fn (mixed $id): int => (int) $id);
    }

    /**
     * Participation by region when several are in view; otherwise the HEIs
     * yet to contribute, for the office to follow up.
     *
     * @return array{regions: list<array{id: int, name: string, participating: int, total: int}>, waiting: array{count: int, heis: list<array{id: int, name: string}>}}
     */
    private function reach(DashboardScope $scope, ReportingPeriod $period): array
    {
        if ($scope->isNational() && ! $scope->heisOnly()) {
            $totals = $scope->heis()->toBase()
                ->join('survey_clusters as rc', 'rc.id', '=', 'survey_heis.survey_cluster_id')
                ->groupBy('rc.survey_region_id')
                ->selectRaw('rc.survey_region_id as region, count(*) as total')
                ->pluck('total', 'region');
            $participating = $scope->tallies($period)
                ->join('survey_heis as ph', 'ph.id', '=', 't.survey_hei_id')
                ->join('survey_clusters as pc', 'pc.id', '=', 'ph.survey_cluster_id')
                ->where('ph.is_active', true)
                ->where('t.responses', '>', 0)
                ->groupBy('pc.survey_region_id')
                ->selectRaw('pc.survey_region_id as region, count(distinct t.survey_hei_id) as participating')
                ->pluck('participating', 'region');

            return [
                // Leaders first: the highest share, then the most HEIs
                // contributing, then the office order. The card shows the
                // first few and the rest open in a table.
                'regions' => array_values(SurveyRegion::query()->whereIn('id', $totals->keys())->orderBy('id')->get(['id', 'name'])
                    ->map(fn (SurveyRegion $region): array => [
                        'id' => $region->id,
                        'name' => $region->name,
                        'participating' => (int) ($participating[$region->id] ?? 0),
                        'total' => (int) $totals[$region->id],
                    ])
                    ->sort(fn (array $a, array $b): int => [$b['participating'] * $a['total'], $b['participating'], $a['id']]
                        <=> [$a['participating'] * $b['total'], $a['participating'], $b['id']])
                    ->all()),
                'waiting' => ['count' => 0, 'heis' => []],
            ];
        }

        $waiting = $scope->heis()->whereNotIn('survey_heis.id', $this->contributing($scope, $period));

        return [
            'regions' => [],
            'waiting' => [
                'count' => (clone $waiting)->count(),
                'heis' => array_values($waiting->orderBy('name')->limit(self::WAITING_NAMES)->get(['survey_heis.id', 'survey_heis.name'])
                    ->map(fn (SurveyHei $hei): array => ['id' => $hei->id, 'name' => $hei->name])->all()),
            ],
        ];
    }

    /** @return list<array{id: int, code: string, title: string, responses: int}> */
    private function laws(DashboardScope $scope, ReportingPeriod $period): array
    {
        $counts = $scope->tallies($period)
            ->groupBy('t.survey_id')
            ->selectRaw('t.survey_id as survey, sum(t.responses) as responses')
            ->pluck('responses', 'survey');

        return array_values($this->surveys()
            ->when($scope->surveyId, fn ($surveys) => $surveys->where('id', $scope->surveyId))
            ->map(fn (Survey $survey): array => [
                'id' => $survey->id,
                'code' => $survey->code,
                'title' => $survey->law_title,
                'responses' => (int) ($counts[$survey->id] ?? 0),
            ])->all());
    }

    /**
     * Responses by respondent group and by sex. "Not given" counts answers
     * a questionnaire left optional.
     *
     * @return array{groups: list<array{value: string, label: string, responses: int}>, sexes: list<array{value: string, label: string, responses: int}>}
     */
    private function respondents(DashboardScope $scope, ReportingPeriod $period): array
    {
        $groups = SurveyRespondentGroup::query()->orderBy('sort_order')->get(['value', 'label', 'is_active']);
        $labels = $groups->pluck('label', 'value');
        $order = array_values(array_map(strval(...), $groups->where('is_active', true)->pluck('value')->all()));

        return [
            'groups' => $this->breakdown($scope, $period, 'respondent_group', $order, fn (string $value): string => $labels[$value] ?? Str::headline($value)),
            'sexes' => $this->breakdown($scope, $period, 'sex', ['female', 'male', 'intersex', 'prefer-not-to-say'], fn (string $value): string => Str::ucfirst(str_replace('-', ' ', $value))),
        ];
    }

    /**
     * One answer's counts: every known value in the given order, even at
     * zero (so a chart's colours stay with their values), then any others,
     * and unanswered ("Not given") last.
     *
     * @param  'respondent_group'|'sex'  $column
     * @param  list<string>  $order
     * @param  callable(string): string  $label
     * @return list<array{value: string, label: string, responses: int}>
     */
    private function breakdown(DashboardScope $scope, ReportingPeriod $period, string $column, array $order, callable $label): array
    {
        $counts = $scope->tallies($period)
            ->groupBy("t.{$column}")
            ->selectRaw("t.{$column} as value, sum(t.responses) as responses")
            ->get()
            ->mapWithKeys(fn (\stdClass $row): array => [(string) ($row->value ?? '') => (int) $row->responses])
            ->filter(fn (int $responses): bool => $responses > 0);
        $rank = fn (string $value): int => match (true) {
            $value === '' => count($order) + 1,
            in_array($value, $order, true) => (int) array_search($value, $order, true),
            default => count($order),
        };

        return array_values(collect($order)->merge($counts->keys())->unique()
            ->sortBy($rank)
            ->map(fn (string $value): array => [
                'value' => $value === '' ? 'not-given' : $value,
                'label' => $value === '' ? 'Not given' : $label($value),
                'responses' => (int) ($counts[$value] ?? 0),
            ])
            ->all());
    }

    /**
     * @return array{reactions: int, comments: int, shares: int, contributors: int, sources: list<array{value: string, posts: int}>}
     */
    private function community(DashboardScope $scope, ReportingPeriod $period): array
    {
        [$from, $until] = $period->utcBounds();
        $activity = fn (string $table): int => $scope->placePosts(DB::table("{$table} as a")->join('posts as p', 'p.id', '=', 'a.post_id'))
            ->where('a.created_at', '>=', $from)
            ->where('a.created_at', '<', $until)
            ->count();
        // Who posted: public or private HEIs (or one whose ownership is not
        // recorded yet), or CHED offices.
        $source = "case when p.survey_hei_id is null then 'ched' else coalesce(h.ownership, 'unrecorded') end";
        $sources = $scope->posts($period)
            ->selectRaw("{$source} as source, count(*) as posts")
            ->groupByRaw($source)
            ->pluck('posts', 'source');

        return [
            'reactions' => $activity('post_reactions'),
            'comments' => $activity('post_comments'),
            'shares' => $scope->posts($period, shares: true)->count(),
            'contributors' => $scope->posts($period)->whereNotNull('p.survey_hei_id')->distinct()->count('p.survey_hei_id'),
            'sources' => array_values(array_filter(array_map(
                fn (string $value): array => ['value' => $value, 'posts' => (int) ($sources[$value] ?? 0)],
                ['public', 'private', 'unrecorded', 'ched'],
            ), fn (array $row): bool => $row['posts'] > 0)),
        ];
    }

    /** @return \Illuminate\Database\Eloquent\Collection<int, Survey> */
    private function surveys(): \Illuminate\Database\Eloquent\Collection
    {
        $slugs = array_keys(SurveyDefinitions::factories());

        return Survey::query()->whereIn('slug', $slugs)->get(['id', 'slug', 'code', 'law_title'])
            ->sortBy(fn (Survey $survey): int => (int) array_search($survey->slug, $slugs, true))
            ->values();
    }
}
