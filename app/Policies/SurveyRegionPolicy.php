<?php

namespace App\Policies;

use App\Models\SurveyRegion;
use App\Models\User;

/**
 * Who may open the regions page and keep a regional office's letterhead up to
 * date. Directory managers see every region; an office changes its own
 * region's office details, and the Central Office every region's.
 */
class SurveyRegionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('survey-directories.view') || $user->hasPermissionTo('region-offices.update');
    }

    public function updateOffice(User $user, SurveyRegion $region): bool
    {
        return $user->hasPermissionTo('region-offices.update') && $user->reachesRegion($region->id);
    }
}
