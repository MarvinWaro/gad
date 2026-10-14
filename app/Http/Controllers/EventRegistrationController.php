<?php

namespace App\Http\Controllers;

use App\Actions\Events\ManageEventRegistration;
use App\Models\GadEvent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Joining a GAD event from its page, or leaving it (docs/event-registration.md).
 * The rules live in ManageEventRegistration.
 */
class EventRegistrationController extends Controller
{
    public function store(Request $request, GadEvent $event, ManageEventRegistration $registrations): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $registrations->join($user, $event);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('You joined :event. Show your Virtual ID at the registration table.', ['event' => $event->title])]);

        return back();
    }

    public function destroy(Request $request, GadEvent $event, ManageEventRegistration $registrations): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $registrations->leave($user, $event);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __('You left :event.', ['event' => $event->title])]);

        return back();
    }
}
