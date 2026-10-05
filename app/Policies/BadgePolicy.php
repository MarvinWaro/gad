<?php

namespace App\Policies;

use App\Models\Badge;
use App\Models\User;

/**
 * Who may run badges. Staff work on the badges of the region their office
 * covers; a national badge, the system badges included, is the Central
 * Office's. Whether a badge can be deleted or awarded by hand at all (only a
 * custom one) is ManageBadge's rule.
 */
class BadgePolicy
{
    /** Settings → Badges. */
    public function manage(User $user): bool
    {
        return $user->hasPermissionTo('badges.view') && $user->hasOffice();
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('badges.create') && $user->hasOffice();
    }

    /**
     * The badge's page: who holds it. A national badge is listed for every
     * office, which sees its own region's holders.
     */
    public function view(User $user, Badge $badge): bool
    {
        return $this->manage($user)
            && ($badge->survey_region_id === null || $user->reachesRegion($badge->survey_region_id));
    }

    public function update(User $user, Badge $badge): bool
    {
        return $user->hasPermissionTo('badges.update') && $user->reachesRegion($badge->survey_region_id);
    }

    public function delete(User $user, Badge $badge): bool
    {
        return $user->hasPermissionTo('badges.delete') && $user->reachesRegion($badge->survey_region_id);
    }

    public function award(User $user, Badge $badge): bool
    {
        return $user->hasPermissionTo('badges.award') && $user->reachesRegion($badge->survey_region_id);
    }
}
