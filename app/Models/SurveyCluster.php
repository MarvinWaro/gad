<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['survey_region_id', 'name', 'is_active'])]
class SurveyCluster extends Model
{
    /** Holding cluster for institutions whose province is not known yet. */
    public const UNASSIGNED = 'Unassigned';

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** A region's holding cluster, made the first time an institution needs it. */
    public static function holdingFor(int $regionId): self
    {
        return self::query()->firstOrCreate(
            ['survey_region_id' => $regionId, 'name' => self::UNASSIGNED],
            ['is_active' => true],
        );
    }

    /**
     * Where an institution goes when no cluster is chosen: beside the
     * region's others when they all sit in one cluster, so no second cluster
     * (and no cluster step) appears; otherwise the holding cluster. Null
     * when that holding cluster does not exist yet.
     */
    public static function defaultIdFor(int $regionId): ?int
    {
        $placed = self::query()->where('survey_region_id', $regionId)->whereHas('heis')->limit(2)->pluck('id');
        if ($placed->count() === 1) {
            return (int) $placed->first();
        }

        $holding = self::query()->where('survey_region_id', $regionId)->where('name', self::UNASSIGNED)->value('id');

        return $holding === null ? null : (int) $holding;
    }

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** @return HasMany<SurveyHei, $this> */
    public function heis(): HasMany
    {
        return $this->hasMany(SurveyHei::class);
    }
}
