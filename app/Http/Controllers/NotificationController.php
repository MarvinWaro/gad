<?php

namespace App\Http\Controllers;

use App\Enums\ActivityModule;
use App\Enums\NotificationKind;
use App\Http\Requests\NotificationFilterRequest;
use App\Http\Requests\UpdateNotificationRequest;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationInbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in person's notifications: the Notifications page, and the
 * JSON the header's bell reads and changes them through.
 */
class NotificationController extends Controller
{
    public function __construct(private readonly NotificationInbox $inbox) {}

    /** Every notification, newest first, loading more as the reader scrolls. */
    public function index(NotificationFilterRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $kinds = $this->inbox->kindsOf($user);

        return Inertia::render('notifications/index', [
            'notifications' => Inertia::scroll(fn () => NotificationResource::collection(
                $this->inbox->query($user, $filters)->cursorPaginate(NotificationInbox::PAGE_SIZE),
            )),
            'filters' => [
                'status' => (string) ($filters['status'] ?? ''),
                'search' => (string) ($filters['search'] ?? ''),
                'kind' => (string) ($filters['kind'] ?? ''),
                'module' => (string) ($filters['module'] ?? ''),
            ],
            // Only what this person has been told about.
            'kinds' => array_map(fn (NotificationKind $kind): array => [
                'value' => $kind->value,
                'label' => $kind->label(),
            ], $kinds),
            'modules' => collect($kinds)
                ->map(fn (NotificationKind $kind): ActivityModule => $kind->module())
                ->unique(fn (ActivityModule $module): string => $module->value)
                ->map(fn (ActivityModule $module): array => ['value' => $module->value, 'label' => $module->label()])
                ->sortBy('label')
                ->values(),
        ]);
    }

    /** The bell's panel: the newest few, a page at a time, with the counts. */
    public function recent(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        return NotificationResource::collection(
            $this->inbox->query($user)->cursorPaginate(NotificationInbox::RECENT_PER_PAGE),
        )->additional(['inbox' => $this->inbox->summary($user)]);
    }

    /** How many are unread and when the newest came, asked every 30 seconds. */
    public function summary(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json($this->inbox->summary($user));
    }

    /** Opening a notification reads it and goes where it points. */
    public function open(Request $request, Notification $notification): RedirectResponse
    {
        Gate::authorize('view', $notification);

        /** @var User $user */
        $user = $request->user();
        $this->inbox->setRead($notification, true);
        $url = $notification->linkFor($user);

        if ($url === null) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('What this notification points to is no longer available.'),
            ]);

            return to_route('notifications.index');
        }

        return redirect()->to($url);
    }

    public function update(UpdateNotificationRequest $request, Notification $notification): JsonResponse
    {
        Gate::authorize('update', $notification);

        /** @var User $user */
        $user = $request->user();
        $this->inbox->setRead($notification, $request->boolean('read'));

        return response()->json([
            'notification' => (new NotificationResource($notification->load(NotificationInbox::RELATIONS)))->resolve($request),
            'inbox' => $this->inbox->summary($user),
        ]);
    }

    public function readAll(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->inbox->markAllRead($user);

        return response()->json(['inbox' => $this->inbox->summary($user)]);
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        Gate::authorize('delete', $notification);

        /** @var User $user */
        $user = $request->user();
        $notification->delete();

        return response()->json(['inbox' => $this->inbox->summary($user)]);
    }
}
