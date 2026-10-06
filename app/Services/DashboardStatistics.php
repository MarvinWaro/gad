<?php

namespace App\Services;

use App\Enums\AchieveItem;
use App\Enums\SustainableDevelopmentGoal;
use App\Enums\UserStatus;
use App\Models\GadEvent;
use App\Models\Survey;
use App\Models\User;
use App\Support\DashboardScope;
use App\Support\EventCalendar;
use App\Support\ReportingPeriod;
use App\Support\StudentStatistics;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The staff dashboard's figures for the places an account's office covers.
 * Everything is counted in SQL. Survey figures come from SurveyStatistics,
 * which reads the tallies that outlive the responses. The same payload can
 * serve a future /api/v1/statistics endpoint; see docs/dashboard.md.
 */
class DashboardStatistics
{
    public function __construct(private readonly SurveyStatistics $surveys) {}

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
            ...$this->surveys->filterState($user, $scope, $period, $filters),
            'hasOffice' => $user->hasOffice(),
            // Who sees an event follows the viewer, not the cached scope.
            'events' => EventCalendar::upcoming($user, 4),
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
                'responses' => $this->surveys->responses($scope, $period),
                'participation' => $this->surveys->participation($scope, $period),
                'posts' => $this->posts($scope, $period),
                'accounts' => $this->accounts($scope, $period),
            ],
            'trend' => $this->trend($scope, $period),
            'reach' => $this->surveys->reach($scope, $period, self::WAITING_NAMES),
            'laws' => $this->surveys->laws($scope, $period),
            'respondents' => $this->surveys->respondents($scope, $period),
            'community' => $this->community($scope, $period),
            // Enrollment and graduates by sex: regional totals from Settings → Statistics.
            'students' => StudentStatistics::forDashboard($scope, $period),
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
        $days = $this->surveys->responsesPerDay($scope, $period);

        return array_map(fn (array $bucket): array => [
            'label' => $bucket['label'],
            'title' => $bucket['title'],
            'responses' => $this->surveys->responsesBetween($days, $bucket['starts_on'], $bucket['ends_on']),
            'posts' => $scope->posts($period)
                ->where('p.created_at', '>=', CarbonImmutable::parse($bucket['starts_on'], GadEvent::TIMEZONE)->utc())
                ->where('p.created_at', '<', CarbonImmutable::parse($bucket['ends_on'], GadEvent::TIMEZONE)->addDay()->utc())
                ->count(),
        ], $period->buckets());
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
}
