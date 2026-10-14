<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GadEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The QR scanner: staff pick one of today's GAD events and check people in
 * by their Virtual ID (docs/event-check-in.md).
 */
class EventScannerController extends Controller
{
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $today = GadEvent::localNow();
        // Only today's, so the list stays short at national scale too.
        $events = GadEvent::query()
            ->visibleTo($user)
            ->openForCheckIn($today)
            ->with('region:id,name')
            ->orderBy('starts_at')
            ->orderBy('id')
            ->get();
        // The one in the address, or the only one there is.
        $selected = $events->firstWhere('id', $request->integer('event'))
            ?? ($events->count() === 1 ? $events->first() : null);

        return Inertia::render('admin/scanner', [
            'events' => $events->map(fn (GadEvent $event): array => [
                ...$event->toCalendarArray(),
                'region' => $event->region?->name,
            ])->values(),
            'event' => $selected?->id,
            'checkedIn' => fn (): int => $selected?->checkIns()->where('attended_on', $today->toDateString())->count() ?? 0,
        ]);
    }
}
