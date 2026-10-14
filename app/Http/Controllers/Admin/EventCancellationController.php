<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Events\CancelEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\EventCancellationRequest;
use App\Models\GadEvent;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/** Calling a GAD event off, or putting it back on (CancelEvent). */
class EventCancellationController extends Controller
{
    public function update(EventCancellationRequest $request, GadEvent $event, CancelEvent $cancellation): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $cancelled = $request->boolean('cancelled');
        $cancelled ? $cancellation->cancel($staff, $event) : $cancellation->restore($staff, $event);

        Inertia::flash('toast', $cancelled
            ? ['type' => 'deleted', 'message' => __(':event was cancelled. Everyone who joined was told.', ['event' => $event->title])]
            : ['type' => 'success', 'message' => __(':event is back on. Everyone who joined was told.', ['event' => $event->title])]);

        return back();
    }
}
