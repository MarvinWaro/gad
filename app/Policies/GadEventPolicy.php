<?php

namespace App\Policies;

use App\Models\GadEvent;
use App\Models\User;

/**
 * Who may open, join, add and change GAD events, see who joined them, and
 * check people in to them. Staff work on the events of the region their
 * office covers; an event for every region is the Central Office's.
 *
 * No ability here shares a name with a permission slug: Gate::before would
 * grant it outright.
 */
class GadEventPolicy
{
    /**
     * An event's page: whoever sees it by region, and whoever joined it or
     * was added to it from another region (GadEvent::scopeOnCalendarOf).
     * Staff work below still follows the region alone.
     */
    public function view(User $user, GadEvent $event): bool
    {
        return $event->isVisibleTo($user) || $event->isRegisteredFor($user);
    }

    /**
     * Joining it, or leaving it (docs/event-registration.md): anyone who
     * sees it, except at a deadline, which nobody attends. Whether
     * registration is still open is ManageEventRegistration's to say.
     */
    public function join(User $user, GadEvent $event): bool
    {
        return $event->category !== 'deadline' && $this->view($user, $event);
    }

    /**
     * How many joined, and who (docs/event-registration.md): the CHED Focal
     * of the event's region and Administrators (`events.view-registrations`),
     * for the events they see by region. An event for every region shows
     * them everyone who joined, from every region.
     */
    public function viewRegistrations(User $user, GadEvent $event): bool
    {
        return $user->hasPermissionTo('events.view-registrations') && $event->isVisibleTo($user);
    }

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

    /**
     * Checking people in with the QR scanner: at any event the staff member
     * sees, so their own region's and every region's (the Central Office's
     * at all of them), but never at a deadline, which nobody attends.
     */
    public function checkIn(User $user, GadEvent $event): bool
    {
        return $user->hasPermissionTo('events.check-in')
            && $event->category !== 'deadline'
            && $event->isVisibleTo($user);
    }
}
