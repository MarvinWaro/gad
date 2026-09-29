<?php

namespace App\Models\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * For records filed under a region through a `survey_region_id` column, so
 * staff see only what their office covers.
 */
trait BelongsToRegion
{
    /**
     * Records within the staff account's office: every region for national
     * access, its own region otherwise, and none without an office.
     *
     * @param  Builder<static>  $query
     */
    public function scopeWithinReachOf(Builder $query, User $user): void
    {
        if ($user->national_access) {
            return;
        }

        if ($user->survey_region_id === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where($this->qualifyColumn('survey_region_id'), $user->survey_region_id);
    }
}
