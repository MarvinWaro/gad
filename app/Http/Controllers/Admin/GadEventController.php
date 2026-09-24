<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveGadEventRequest;
use App\Models\GadEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GadEventController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $events = GadEvent::query()
            ->with('creator:id,name')
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('title', 'like', "%{$search}%")
                ->orWhere('location', 'like', "%{$search}%")))
            ->orderByDesc('starts_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (GadEvent $event): array => [
                ...$event->toCalendarArray(),
                'created_by' => $event->creator?->name,
            ]);

        return Inertia::render('admin/events/index', [
            'events' => $events,
            'categories' => GadEvent::CATEGORIES,
            'filters' => ['search' => $search],
            'permissions' => [
                'create' => $request->user()->can('events.create'),
                'update' => $request->user()->can('events.update'),
                'delete' => $request->user()->can('events.delete'),
            ],
        ]);
    }

    public function store(SaveGadEventRequest $request): RedirectResponse
    {
        GadEvent::query()->create([
            ...$request->eventAttributes(),
            'created_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event created.')]);

        return to_route('admin.events.index');
    }

    public function update(SaveGadEventRequest $request, GadEvent $event): RedirectResponse
    {
        $event->update($request->eventAttributes());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event updated.')]);

        return back();
    }

    public function destroy(GadEvent $event): RedirectResponse
    {
        $event->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event deleted.')]);

        return back();
    }
}
