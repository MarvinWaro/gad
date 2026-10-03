<?php

namespace App\Support;

use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * The academic year and place filters of CHED's record lists (monitoring
 * reports and the GAD checklists), for records filed under an HEI and its
 * region.
 */
class PlaceFilters
{
    /** @return array<string, array<int, string>> */
    public static function rules(): array
    {
        return [
            'academic_year' => ['nullable', 'regex:/^\d{4}-\d{4}$/'],
            'region' => ['nullable', 'integer', 'exists:survey_regions,id'],
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
        foreach (['academic_year' => 'academic_year', 'region' => 'survey_region_id', 'hei' => 'survey_hei_id'] as $filter => $column) {
            if (! empty($filters[$filter])) {
                $query->where($query->qualifyColumn($column), $filters[$filter]);
            }
        }
    }

    /**
     * The places the staff account can pick from. A regional office has its
     * one region; only the Central Office picks. HEIs list once a region is
     * set. Clusters stay out of sight: they only link an HEI to its region.
     *
     * @param  array<string, mixed>  $filters
     * @return array{regions: Collection<int, SurveyRegion>, heis: Collection<int, SurveyHei>}
     */
    public static function options(User $user, array $filters): array
    {
        $regions = SurveyRegion::query()
            ->when(! $user->national_access, fn ($query) => $query->whereKey($user->survey_region_id))
            ->orderBy('name')
            ->get(['id', 'name']);
        $regionId = $user->national_access ? (int) ($filters['region'] ?? 0) : (int) $user->survey_region_id;
        $regionId = $regions->contains('id', $regionId) ? $regionId : null;

        return [
            'regions' => $regions,
            'heis' => $regionId === null
                ? new Collection
                : SurveyHei::query()
                    ->whereHas('cluster', fn (Builder $query) => $query->where('survey_region_id', $regionId))
                    ->orderBy('name')
                    ->get(['id', 'name']),
        ];
    }
}
