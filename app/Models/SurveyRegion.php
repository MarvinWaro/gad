<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'is_active'])]
class SurveyRegion extends Model
{
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return HasMany<SurveyCluster, $this> */
    public function clusters(): HasMany
    {
        return $this->hasMany(SurveyCluster::class);
    }
}
