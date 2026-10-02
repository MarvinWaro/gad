<?php

namespace App\Support;

use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Facades\DB;

/**
 * Whose figures the dashboard shows: the places the staff account's office
 * covers, narrowed by the region, cluster, HEI, ownership and law filters.
 *
 * Places follow CLAUDE.md. An HEI's records belong to its region through its
 * cluster. A CHED post belongs to its author's regional office; a Central
 * Office post belongs to no region, so it counts only in national figures.
 * Choosing a cluster, an HEI or an ownership narrows everything to HEIs.
 */
final class DashboardScope
{
    /** Where a post belongs, for posts joined as p, h (HEI), c (cluster) and u (author). */
    private const POST_REGION = 'coalesce(c.survey_region_id, case when p.survey_hei_id is null then u.survey_region_id end)';

    private function __construct(
        public readonly bool $hasOffice,
        public readonly bool $nationalAccess,
        public readonly ?int $regionId,
        public readonly ?int $clusterId,
        public readonly ?int $heiId,
        public readonly ?string $ownership,
        public readonly ?int $surveyId,
    ) {}

    /** @param  array<string, mixed>  $filters */
    public static function for(User $user, array $filters): self
    {
        $regionId = $user->national_access
            ? (filled($filters['region'] ?? null) ? (int) $filters['region'] : null)
            : $user->survey_region_id;
        $clusterId = filled($filters['cluster'] ?? null) ? (int) $filters['cluster'] : null;
        $heiId = filled($filters['hei'] ?? null) ? (int) $filters['hei'] : null;

        // A cluster or HEI only counts when it lies in the region in view.
        if ($clusterId !== null && ! SurveyCluster::query()->whereKey($clusterId)->when($regionId, fn ($query) => $query->where('survey_region_id', $regionId))->exists()) {
            $clusterId = null;
        }
        if ($heiId !== null && ! SurveyHei::query()->whereKey($heiId)
            ->when($regionId, fn ($query) => $query->whereHas('cluster', fn ($query) => $query->where('survey_region_id', $regionId)))
            ->when($clusterId, fn ($query) => $query->where('survey_cluster_id', $clusterId))
            ->exists()) {
            $heiId = null;
        }

        return new self(
            hasOffice: $user->hasOffice(),
            nationalAccess: $user->national_access,
            regionId: $regionId,
            clusterId: $clusterId,
            heiId: $heiId,
            ownership: is_string($filters['ownership'] ?? null) ? $filters['ownership'] : null,
            surveyId: filled($filters['survey'] ?? null) ? (int) $filters['survey'] : null,
        );
    }

    /** Every region is in view: the Central Office, before it picks one. */
    public function isNational(): bool
    {
        return $this->hasOffice && $this->nationalAccess && $this->regionId === null;
    }

    /** Only HEIs' records count: a cluster, an HEI or an ownership is chosen. */
    public function heisOnly(): bool
    {
        return $this->clusterId !== null || $this->heiId !== null || $this->ownership !== null;
    }

    /** What the figures cover, such as "National overview" or an HEI's name. */
    public function label(): string
    {
        return match (true) {
            $this->heiId !== null => (string) SurveyHei::query()->whereKey($this->heiId)->value('name'),
            $this->clusterId !== null => (string) SurveyCluster::query()->whereKey($this->clusterId)->value('name'),
            $this->regionId !== null => (string) SurveyRegion::query()->whereKey($this->regionId)->value('name'),
            default => 'National overview',
        };
    }

    /**
     * Active HEIs in view.
     *
     * @return Builder<SurveyHei>
     */
    public function heis(): Builder
    {
        return SurveyHei::query()
            ->where('survey_heis.is_active', true)
            ->when(! $this->hasOffice, fn (Builder $query) => $query->whereRaw('1 = 0'))
            ->when($this->regionId, fn (Builder $query) => $query->whereHas('cluster', fn (Builder $query) => $query->where('survey_region_id', $this->regionId)))
            ->when($this->clusterId, fn (Builder $query) => $query->where('survey_heis.survey_cluster_id', $this->clusterId))
            ->when($this->heiId, fn (Builder $query) => $query->whereKey($this->heiId))
            ->when($this->ownership, fn (Builder $query) => $query->where('survey_heis.ownership', $this->ownership));
    }

    /** Survey tallies in view, as t, between two Philippine dates. */
    public function tallies(ReportingPeriod $period): QueryBuilder
    {
        return DB::table('survey_response_tallies as t')
            ->whereBetween('t.date', [$period->startsOn->toDateString(), $period->endsOn->toDateString()])
            ->when(! $this->hasOffice, fn (QueryBuilder $query) => $query->whereRaw('1 = 0'))
            ->when($this->regionId, fn (QueryBuilder $query) => $query->where('t.survey_region_id', $this->regionId))
            ->when($this->clusterId, fn (QueryBuilder $query) => $query->where('t.survey_cluster_id', $this->clusterId))
            ->when($this->heiId, fn (QueryBuilder $query) => $query->where('t.survey_hei_id', $this->heiId))
            ->when($this->ownership, fn (QueryBuilder $query) => $query->whereExists(fn (QueryBuilder $query) => $query
                ->from('survey_heis as oh')
                ->whereColumn('oh.id', 't.survey_hei_id')
                ->where('oh.ownership', $this->ownership)))
            ->when($this->surveyId, fn (QueryBuilder $query) => $query->where('t.survey_id', $this->surveyId));
    }

    /**
     * Posts in view made during the period, as p: originals, or only shares.
     * Joined: h (HEI), c (its cluster) and u (the author).
     */
    public function posts(ReportingPeriod $period, bool $shares = false): QueryBuilder
    {
        [$from, $until] = $period->utcBounds();
        $query = DB::table('posts as p')
            ->where('p.created_at', '>=', $from)
            ->where('p.created_at', '<', $until)
            ->when($shares, fn (QueryBuilder $query) => $query->whereNotNull('p.shared_post_id'), fn (QueryBuilder $query) => $query->whereNull('p.shared_post_id'));

        return $this->placePosts($query);
    }

    /** Narrow a query that has posts joined as p to the posts in view. */
    public function placePosts(QueryBuilder $query): QueryBuilder
    {
        return $query
            ->leftJoin('survey_heis as h', 'h.id', '=', 'p.survey_hei_id')
            ->leftJoin('survey_clusters as c', 'c.id', '=', 'h.survey_cluster_id')
            ->join('users as u', 'u.id', '=', 'p.user_id')
            ->when(! $this->hasOffice, fn (QueryBuilder $query) => $query->whereRaw('1 = 0'))
            ->when($this->regionId, fn (QueryBuilder $query) => $query->whereRaw(self::POST_REGION.' = ?', [$this->regionId]))
            ->when($this->heisOnly(), fn (QueryBuilder $query) => $query->whereNotNull('p.survey_hei_id'))
            ->when($this->clusterId, fn (QueryBuilder $query) => $query->where('h.survey_cluster_id', $this->clusterId))
            ->when($this->heiId, fn (QueryBuilder $query) => $query->where('p.survey_hei_id', $this->heiId))
            ->when($this->ownership, fn (QueryBuilder $query) => $query->where('h.ownership', $this->ownership));
    }

    /**
     * The SQL for a post's region, for grouping posts joined by placePosts().
     *
     * @return literal-string
     */
    public function postRegion(): string
    {
        return self::POST_REGION;
    }

    /**
     * Accounts in view: HEI accounts through their institution, staff
     * through their regional office. Central Office staff count only
     * nationally.
     *
     * @return Builder<User>
     */
    public function users(): Builder
    {
        return User::query()
            ->when(! $this->hasOffice, fn (Builder $query) => $query->whereRaw('1 = 0'))
            ->when($this->regionId && ! $this->heisOnly(), fn (Builder $query) => $query->placedIn($this->regionId))
            ->when($this->heisOnly(), fn (Builder $query) => $query->whereHas('hei', fn (Builder $query) => $query
                ->when($this->regionId, fn (Builder $query) => $query->whereHas('cluster', fn (Builder $query) => $query->where('survey_region_id', $this->regionId)))
                ->when($this->clusterId, fn (Builder $query) => $query->where('survey_cluster_id', $this->clusterId))
                ->when($this->heiId, fn (Builder $query) => $query->whereKey($this->heiId))
                ->when($this->ownership, fn (Builder $query) => $query->where('ownership', $this->ownership))));
    }

    /** @return array<string, int|string|bool|null> */
    public function cacheKey(): array
    {
        return get_object_vars($this);
    }
}
