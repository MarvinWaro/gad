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
