<?php

namespace App\Http\Controllers;

use App\Http\Requests\PublicEventFilterRequest;
use App\Http\Resources\PublicEventResource;
use App\Models\GadEvent;
use App\Models\User;
use App\Support\PageRange;
use App\Support\PublicEvents;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public website's GAD events (docs/event-registration.md): the list,
 * by region, those on now first, and each event's own page, where a visitor
 * logs in to join. Nothing about who joined is ever shown here.
 */
class PublicEventController extends Controller
{
    public function index(PublicEventFilterRequest $request): Response
    {
        $filters = $request->filters();

        return Inertia::render('gad-events/index', [
            'events' => PublicEventResource::collection(PageRange::within(
                PublicEvents::page($filters['region'], $filters['when'] === 'past'),
            )),
            'filters' => $filters,
            'regions' => PublicEvents::regions(),
        ]);
    }

    /**
     * An event's public page. Someone signed in who can see the event joins
     * it on its own page instead; anyone else reads this one.
     */
    public function show(Request $request, GadEvent $event): Response|RedirectResponse
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user?->can('view', $event)) {
            return to_route('events.show', $event);
        }

        abort_unless($event->isOnPublicSite(), 404);
        $event->load('region:id,name');

        return Inertia::render('gad-events/show', [
            'event' => PublicEventResource::make($event)->resolve($request),
            // Signed in, from another region: told whose event it is,
            // rather than asked to log in.
            'signedIn' => $user !== null,
        ]);
    }
}
