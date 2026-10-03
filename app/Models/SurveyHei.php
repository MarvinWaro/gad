<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $survey_cluster_id
 * @property string|null $uii
 * @property string $name
 * @property string|null $ownership
 * @property bool $is_active
 * @property Carbon|null $portal_synced_at when the HEIDA sync last saw it
 */
#[Fillable(['survey_cluster_id', 'uii', 'name', 'ownership', 'is_active', 'portal_synced_at'])]
class SurveyHei extends Model
{
    /** Who runs an institution, as the directory stores it. */
    public const OWNERSHIPS = ['public', 'private'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'portal_synced_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SurveyCluster, $this> */
    public function cluster(): BelongsTo
    {
        return $this->belongsTo(SurveyCluster::class, 'survey_cluster_id');
    }

    /**
     * A region's active institutions, for a picker that loads them once the
     * region is chosen (registration, website feedback). With every HEI in
     * the country listed, sending them all would weigh down the page.
     *
     * @return list<array{id: int, name: string, region_id: int}>
     */
    public static function pickerOptions(int $regionId): array
    {
        return array_values(self::query()
            ->join('survey_clusters', 'survey_clusters.id', '=', 'survey_heis.survey_cluster_id')
            ->where('survey_clusters.survey_region_id', $regionId)
            ->where('survey_heis.is_active', true)
            ->orderBy('survey_heis.name')
            ->get(['survey_heis.id', 'survey_heis.name', 'survey_clusters.survey_region_id'])
            ->map(fn (self $hei): array => [
                'id' => $hei->id,
                'name' => $hei->name,
                'region_id' => (int) $hei->getAttribute('survey_region_id'),
            ])
            ->all());
    }
}
