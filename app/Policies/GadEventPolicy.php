<?php

namespace App\Policies;

use App\Models\GadEvent;
use App\Models\User;

/**
 * Who may add and change GAD events. Staff work on the events of the region
 * their office covers; an event for every region is the Central Office's.
 */
class GadEventPolicy
{
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('events.create') && $user->hasOffice();
    }

    public function update(User $user, GadEvent $event): bool
    {
        return $user->hasPermissionTo('events.update') && $user->reachesRegion($event->survey_region_id);
    }

    public function delete(User $user, GadEvent $event): bool
    {
        return $user->hasPermissionTo('events.delete') && $user->reachesRegion($event->survey_region_id);
    }
}
