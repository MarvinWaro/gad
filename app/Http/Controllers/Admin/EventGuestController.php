<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Certificates\ManageEventCertificate;
use App\Actions\Events\ManageEventGuest;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GiveGuestCertificateRequest;
use App\Http\Requests\Admin\SaveEventGuestRequest;
use App\Models\GadEvent;
use App\Models\GadEventGuest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * An event's guests without an account, on its list of who joined
 * (docs/event-registration.md): adding, correcting and removing them, and
 * giving one the event's certificate. The rules live in ManageEventGuest
 * and ManageEventCertificate.
 */
class EventGuestController extends Controller
{
    public function store(SaveEventGuestRequest $request, GadEvent $event, ManageEventGuest $guests): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $guest = $guests->add($staff, $event, $request->details(), $request->days());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name was added as a guest.', ['name' => $guest->name])]);

        return back();
    }

    public function update(SaveEventGuestRequest $request, GadEvent $event, GadEventGuest $guest, ManageEventGuest $guests): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $guest->setRelation('event', $event);
        $guests->update($staff, $guest, $request->details(), $request->days());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Guest saved.')]);

        return back();
    }

    public function destroy(Request $request, GadEvent $event, GadEventGuest $guest, ManageEventGuest $guests): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $guest->setRelation('event', $event);
        $guests->remove($staff, $guest);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':name was taken off the list.', ['name' => $guest->name])]);

        return back();
    }

    /** A released certificate for a guest who missed a day, as they can't ask for it. */
    public function certificate(GiveGuestCertificateRequest $request, GadEvent $event, GadEventGuest $guest, ManageEventCertificate $certificates): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $use = $request->eventCertificate();
        abort_if($use === null, 404);
        $use->setRelation('event', $event);
        $certificates->giveToGuest($staff, $use, $guest->setRelation('event', $event));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name has the certificate. Download it from its release page to hand over.', ['name' => $guest->name])]);

        return back();
    }
}
