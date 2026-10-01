<?php

namespace App\Support;

use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * The academic year and place filters of CHED's record lists (monitoring
 * reports and the GAD checklists), for records filed under an HEI, cluster
 * and region.
 */
class PlaceFilters
{
    /** @return array<string, array<int, string>> */
    public static function rules(): array
    {
        return [
            'academic_year' => ['nullable', 'regex:/^\d{4}-\d{4}$/'],
            'region' => ['nullable', 'integer', 'exists:survey_regions,id'],
            'cluster' => ['nullable', 'integer', 'exists:survey_clusters,id'],
            'hei' => ['nullable', 'integer', 'exists:survey_heis,id'],
            'search' => ['nullable', 'string', 'max:150'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<string, mixed>  $filters
     */
    public static function apply(Builder $query, array $filters): void
    {
        foreach (['academic_year' => 'academic_year', 'region' => 'survey_region_id', 'cluster' => 'survey_cluster_id', 'hei' => 'survey_hei_id'] as $filter => $column) {
            if (! empty($filters[$filter])) {
                $query->where($query->qualifyColumn($column), $filters[$filter]);
            }
        }
    }

    /**
     * The places the staff account can pick from. A regional office has its
     * one region; only the Central Office picks. Clusters list once a region
     * is set, and HEIs once a cluster is.
     *
     * A cluster is only a choice when the region's institutions sit in two or
     * more. Until then (all of them "Unassigned", say) no clusters are offered
     * and the region's institutions list straight away; assigning them to
     * clusters brings the step back by itself.
     *
     * @param  array<string, mixed>  $filters
     * @return array{regions: Collection<int, SurveyRegion>, clusters: Collection<int, SurveyCluster>, heis: Collection<int, SurveyHei>}
     */
    public static function options(User $user, array $filters): array
    {
        $regions = SurveyRegion::query()
            ->when(! $user->national_access, fn ($query) => $query->whereKey($user->survey_region_id))
            ->orderBy('name')
            ->get(['id', 'name']);
        $regionId = $user->national_access ? (int) ($filters['region'] ?? 0) : (int) $user->survey_region_id;
        $regionId = $regions->contains('id', $regionId) ? $regionId : null;
        $clusters = $regionId ? self::clusterChoices($regionId) : new Collection;
        $clusterId = $clusters->contains('id', (int) ($filters['cluster'] ?? 0)) ? (int) $filters['cluster'] : null;
        $heis = SurveyHei::query()->orderBy('name');

        return [
            'regions' => $regions,
            'clusters' => $clusters,
            'heis' => match (true) {
                $clusterId !== null => $heis->where('survey_cluster_id', $clusterId)->get(['id', 'name']),
                // No cluster to choose: the region's institutions straight away.
                $regionId !== null && $clusters->isEmpty() => $heis
                    ->whereHas('cluster', fn (Builder $query) => $query->where('survey_region_id', $regionId))
                    ->get(['id', 'name']),
                default => new Collection,
            },
        ];
    }

    /**
     * A region's clusters that hold institutions, when there are two or more
     * to choose between; otherwise none.
     *
     * @return Collection<int, SurveyCluster>
     */
    public static function clusterChoices(int $regionId): Collection
    {
        $clusters = SurveyCluster::query()
            ->where('survey_region_id', $regionId)
            ->whereHas('heis')
            ->orderBy('name')
            ->get(['id', 'name']);

        return $clusters->count() > 1 ? $clusters : new Collection;
    }
}
