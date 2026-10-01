<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ActivityLogFilterRequest;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\PlaceFilters;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Who did what in PHLGADIS, newest first. Regional staff see what happened
 * in their region; the Central Office sees everything.
 */
class ActivityLogController extends Controller
{
    public function index(ActivityLogFilterRequest $request): Response
    {
        $actor = $request->user();
        $filters = $request->validated();

        $logs = ActivityLog::query()
            ->withinReachOf($actor)
            ->filter($filters)
            ->with(['user:id,avatar_path', 'subject', 'region:id,name', 'cluster:id,name', 'hei:id,name'])
            ->latest('created_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('settings/activity-logs', [
            'logs' => ActivityLogResource::collection($logs)->response()->getData(true),
            'filters' => [
                'search' => (string) ($filters['search'] ?? ''),
                'module' => (string) ($filters['module'] ?? ''),
                'action' => (string) ($filters['action'] ?? ''),
                'user' => (string) ($filters['user'] ?? ''),
                'from' => (string) ($filters['from'] ?? ''),
                'to' => (string) ($filters['to'] ?? ''),
                'region' => (string) ($filters['region'] ?? ''),
                'cluster' => (string) ($filters['cluster'] ?? ''),
                'hei' => (string) ($filters['hei'] ?? ''),
            ],
            // The person the list is narrowed to, named for the filter chip.
            'person' => isset($filters['user'])
                ? User::query()->whereKey($filters['user'])->first(['id', 'name'])?->only(['id', 'name'])
                : null,
            'modules' => array_map(fn (ActivityModule $module): array => [
                'value' => $module->value,
                'label' => $module->label(),
            ], ActivityModule::cases()),
            'actions' => collect(ActivityAction::cases())
                ->map(fn (ActivityAction $action): array => ['value' => $action->value, 'label' => $action->label()])
                ->sortBy('label')
                ->values(),
            'places' => PlaceFilters::options($actor, $filters),
            'hasOffice' => $actor->hasOffice(),
        ]);
    }
}
