<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $survey_cluster_id
 * @property string|null $uii
 * @property string $name
 * @property string|null $ownership
 * @property bool $is_active
 */
#[Fillable(['survey_cluster_id', 'uii', 'name', 'ownership', 'is_active', 'portal_synced_at'])]
class SurveyHei extends Model
{
    /** Institution ownership as the public survey and the CHED portal express it. */
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
     * The active institutions a person can pick from, with the region each
     * sits in, so a form can narrow the list once a region is chosen
     * (registration, website feedback).
     *
     * @return list<array{id: int, name: string, region_id: int}>
     */
    public static function pickerOptions(): array
    {
        return array_values(self::query()
            ->join('survey_clusters', 'survey_clusters.id', '=', 'survey_heis.survey_cluster_id')
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

    /**
     * Normalise the many spellings the portal and operators use for ownership
     * down to the two values the directory stores.
     */
    public static function normalizeOwnership(?string $value): ?string
    {
        $value = strtolower(trim((string) $value));
        if ($value === '') {
            return null;
        }
        if (str_contains($value, 'private') || str_contains($value, 'sectarian')) {
            return 'private';
        }
        if (str_contains($value, 'public') || str_contains($value, 'state') || str_contains($value, 'local')) {
            return 'public';
        }

        return null;
    }
}
