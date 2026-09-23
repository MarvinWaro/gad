<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['survey_region_id', 'name', 'is_active'])]
class SurveyCluster extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
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
