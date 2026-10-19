<?php

namespace App\Support;

use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use Illuminate\Support\Facades\Cache;

/**
 * The active regions and HEIs a public survey offers, kept in the cache:
 * every respondent loads the whole list, and it changes only when the
 * directory does (the nightly HEIDA sync, or Settings). The directory's
 * models forget it when they change; the hour covers anything else.
 */
final class PublicSurveyDirectory
{
    private const CACHE_KEY = 'surveys:public-directory';

    private const CACHE_SECONDS = 3600;

    /**
     * Each region with its office's email, for asking to have an HEI added,
     * and each HEI with its region.
     *
     * @return array{regions: list<array{id: int, name: string, email: ?string}>, heis: list<array{id: int, name: string, survey_region_id: int}>}
     */
    public static function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, function (): array {
            $regions = SurveyRegion::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'office_email'])
                ->map(fn (SurveyRegion $region): array => ['id' => $region->id, 'name' => $region->name, 'email' => $region->office_email]);
            $heis = SurveyHei::query()
                ->join('survey_clusters', 'survey_clusters.id', '=', 'survey_heis.survey_cluster_id')
                ->where('survey_heis.is_active', true)
                ->whereIn('survey_clusters.survey_region_id', $regions->pluck('id'))
                ->orderBy('survey_heis.name')
                ->get(['survey_heis.id', 'survey_heis.name', 'survey_clusters.survey_region_id'])
                ->map(fn (SurveyHei $hei): array => [
                    'id' => $hei->id,
                    'name' => $hei->name,
                    'survey_region_id' => (int) $hei->getAttribute('survey_region_id'),
                ]);

            return ['regions' => array_values($regions->all()), 'heis' => array_values($heis->all())];
        });
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
