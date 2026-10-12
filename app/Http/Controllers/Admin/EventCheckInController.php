<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Events\CheckInParticipant;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CheckInRequest;
use App\Http\Resources\GadEventCheckInResource;
use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The scanner's requests: checking someone in, and the Recent list of who
 * has been checked in today (docs/event-check-in.md).
 */
class EventCheckInController extends Controller
{
    /** Check-ins per page of the Recent list. */
    public const PER_PAGE = 20;

    /** Today's check-ins at the event, newest first, a page at a time. */
    public function index(GadEvent $event): AnonymousResourceCollection
    {
        return GadEventCheckInResource::collection(
            $this->today($event)
                ->with(GadEventCheckInResource::RELATIONS)
                ->orderByDesc('checked_in_at')
                ->orderByDesc('id')
                ->cursorPaginate(self::PER_PAGE),
        )->additional(['count' => $this->today($event)->count()]);
    }

    /** 201 for a new check-in; 200 when they were already checked in today. */
    public function store(CheckInRequest $request, GadEvent $event, CheckInParticipant $checkIns): JsonResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $outcome = $checkIns->handle($staff, $event, $request->string('code')->toString(), $request->string('method')->toString());
        $outcome['checkIn']->loadMissing(GadEventCheckInResource::RELATIONS);

        return response()->json([
            'status' => $outcome['status'],
            'check_in' => GadEventCheckInResource::make($outcome['checkIn'])->resolve($request),
            'count' => $outcome['count'],
        ], $outcome['status'] === 'checked_in' ? 201 : 200);
    }

    /** @return HasMany<GadEventCheckIn, GadEvent> */
    private function today(GadEvent $event): HasMany
    {
        return $event->checkIns()->where('attended_on', GadEvent::localNow()->toDateString());
    }
}
