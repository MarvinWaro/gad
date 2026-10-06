<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveGadEventRequest;
use App\Models\GadEvent;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use App\Support\PlaceFilters;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GadEventController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));

        $events = GadEvent::query()
            // A regional office lists its own region's events and those for
            // every region; the Central Office lists them all.
            ->visibleTo($user)
            ->with(['creator:id,name', 'region:id,name'])
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('title', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%")))
            ->orderByDesc('starts_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (GadEvent $event): array => [
                ...$event->toCalendarArray(),
                'created_by' => $event->creator?->name,
                'region' => $event->region?->only(['id', 'name']),
                'can' => [
                    'update' => $user->can('update', $event),
                    'delete' => $user->can('delete', $event),
                ],
            ]);

        return Inertia::render('admin/events/index', [
            'events' => $events,
            'categories' => GadEvent::CATEGORIES,
            'filters' => ['search' => $search],
            // Where an event can be for: any region from the Central Office,
            // otherwise the office's own.
            'regions' => PlaceFilters::options($user, [])['regions'],
            'nationalAccess' => (bool) $user->national_access,
            'permissions' => [
                'create' => $user->can('create', GadEvent::class),
                'update' => $user->can('events.update'),
                'delete' => $user->can('events.delete'),
            ],
        ]);
    }

    public function store(SaveGadEventRequest $request, ActivityRecorder $activity, Notifier $notifier): RedirectResponse
    {
        $event = GadEvent::query()->create([
            ...$request->eventAttributes(),
            'created_by' => $request->user()->id,
        ]);
        $notifier->eventCreated($activity->recordSave(ActivityModule::Events, $event));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event created.')]);

        return to_route('admin.events.index');
    }

    public function update(SaveGadEventRequest $request, GadEvent $event, ActivityRecorder $activity): RedirectResponse
    {
        $event->update($request->eventAttributes());
        $activity->recordSave(ActivityModule::Events, $event);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event updated.')]);

        return back();
    }

    public function destroy(GadEvent $event, ActivityRecorder $activity): RedirectResponse
    {
        $event->delete();
        $activity->record(ActivityAction::Deleted, ActivityModule::Events, $event);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __('Event deleted.')]);

        return back();
    }
}
