<?php

namespace App\Http\Controllers;

use App\Http\Resources\CertificateRequestResource;
use App\Http\Resources\EventRegistrationResource;
use App\Http\Resources\GadEventResource;
use App\Http\Resources\MyCertificateResource;
use App\Models\Certificate;
use App\Models\CertificateRequest;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\User;
use App\Support\EventCalendar;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** The full-page GAD event calendar for signed-in users, and each event's page. */
class EventController extends Controller
{
    public function index(Request $request): Response
    {
        $month = $request->string('month')->toString() ?: null;
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('hei/events', [
            'calendar' => fn (): array => EventCalendar::month($user, $month),
            'after' => fn (): array => EventCalendar::after($user, $month),
        ]);
    }

    /**
     * An event's page (docs/event-registration.md): what it is, joining or
     * leaving it, and, once you attended, your certificates from it. Its
     * creator and Administrators see how many joined.
     */
    public function show(Request $request, GadEvent $event): Response
    {
        /** @var User $user */
        $user = $request->user();
        $event->load('region:id,name');

        // How many joined is its creator's and Administrators' to see.
        if ($user->can('viewRegistrations', $event)) {
            $event->loadCount('registrations');
        }

        $registration = $event->registrations()
            ->where('user_id', $user->id)
            ->with(EventRegistrationResource::RELATIONS)
            ->first();

        return Inertia::render('hei/event', [
            'event' => GadEventResource::make($event)->resolve($request),
            'registration' => $registration !== null
                ? EventRegistrationResource::make($registration)->resolve($request)
                : null,
            // The Philippine days you were checked in on.
            'attended' => $event->checkIns()
                ->where('user_id', $user->id)
                ->orderBy('attended_on')
                ->pluck('attended_on')
                ->all(),
            'certificates' => MyCertificateResource::collection(Certificate::query()
                ->where('user_id', $user->id)
                ->whereNull('withdrawn_at')
                ->whereHas('eventCertificate', fn (Builder $query) => $query->where('gad_event_id', $event->id))
                ->with('eventCertificate:id,gad_event_id,snapshot')
                ->orderBy('issued_at')
                ->get())->resolve($request),
            // Asking for a certificate after missing a day (docs/certificates.md):
            // the released ones they don't hold, and what they asked for.
            'requestable' => $event->certificates()
                ->whereNotNull('released_at')
                ->whereDoesntHave('certificates', fn (Builder $query) => $query->where('user_id', $user->id))
                ->whereDoesntHave('certificateRequests', fn (Builder $query) => $query->where('user_id', $user->id))
                ->with('design:id,kind')
                ->get()
                ->map(fn (GadEventCertificate $use): array => ['id' => $use->id, 'title' => $use->design->kind->title()])
                ->values()
                ->all(),
            'requests' => CertificateRequestResource::collection(CertificateRequest::query()
                ->where('user_id', $user->id)
                ->whereHas('eventCertificate', fn (Builder $query) => $query->where('gad_event_id', $event->id))
                ->with('eventCertificate.design:id,kind')
                ->latest()
                ->get())->resolve($request),
            'can' => [
                'join' => $user->can('join', $event),
                'viewRegistrations' => $user->can('viewRegistrations', $event),
                'update' => $user->can('update', $event),
            ],
        ]);
    }
}
