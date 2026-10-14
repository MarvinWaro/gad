<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Certificates\ManageEventCertificate;
use App\Console\Commands\ReleaseDueCertificates;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CertificateFilterRequest;
use App\Http\Requests\Settings\CertificateStatusRequest;
use App\Http\Resources\CertificateHolderResource;
use App\Http\Resources\CertificateRequestResource;
use App\Http\Resources\EventCertificateResource;
use App\Models\Certificate;
use App\Models\CertificateRequest;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\GadEventCheckIn;
use App\Models\User;
use App\Support\PageRange;
use App\Support\PlaceFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * An event's certificate (docs/certificates.md): when it goes out by itself,
 * releasing it early to everyone present on every day, the requests of
 * those who missed a day, the people given it, and withdrawing one given by
 * mistake. The rules live in ManageEventCertificate.
 */
class EventCertificateController extends Controller
{
    public function show(CertificateFilterRequest $request, GadEventCertificate $eventCertificate, ManageEventCertificate $manager): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->filters();
        $search = $filters['search'] ?? '';
        $eventCertificate->load(['design.signatories', 'event.region:id,name', 'releaser:id,name'])
            ->loadCount(['certificates', 'certificates as withdrawn_count' => fn (Builder $query) => $query->whereNotNull('withdrawn_at')]);
        // Present on every day: people and guests alike.
        $eventCertificate->setAttribute('eligible_count', $eventCertificate->eligibleUsers()->count() + $eventCertificate->eligibleGuests()->count());
        $awaiting = $eventCertificate->awaitingUsers()->count() + $eventCertificate->awaitingGuests()->count();

        $requests = $eventCertificate->certificateRequests()
            ->with(['user:id,name,avatar_path,survey_hei_id,survey_region_id', 'user.hei:id,name', 'user.officeRegion:id,name'])
            ->orderByRaw("case when status = 'pending' then 0 else 1 end")
            ->latest()
            ->latest('id')
            ->paginate(20, pageName: 'requests_page')
            ->withQueryString();
        $days = GadEventCheckIn::query()
            ->where('gad_event_id', $eventCertificate->gad_event_id)
            ->whereIn('user_id', $requests->getCollection()->pluck('user_id'))
            ->orderBy('attended_on')
            ->get(['user_id', 'attended_on'])
            ->groupBy('user_id');
        $requests->getCollection()->each(fn (CertificateRequest $asked) => $asked->setAttribute(
            'days',
            $days->get($asked->user_id)?->pluck('attended_on')->values()->all() ?? [],
        ));

        $holders = Certificate::query()
            ->whereBelongsTo($eventCertificate, 'eventCertificate')
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                ->orWhere('number', 'like', '%'.addcslashes($search, '%_\\').'%')));
        PlaceFilters::apply($holders, $filters);

        return Inertia::render('settings/event-certificate', [
            'certificate' => EventCertificateResource::make($eventCertificate)->resolve($request),
            'awaiting' => $awaiting,
            // It goes out by itself when the event ends, unless this stops it.
            'goesOutAt' => $eventCertificate->event->finishesAt()->format('Y-m-d\TH:i:s'),
            'ended' => GadEvent::localNow()->greaterThanOrEqualTo($eventCertificate->event->finishesAt()),
            'automatic' => ReleaseDueCertificates::stillAutomatic($eventCertificate->event),
            'problem' => $manager->printProblem($eventCertificate),
            // The event's other certificates, released and removed with this one.
            'together' => $eventCertificate->event->certificates()
                ->whereKeyNot($eventCertificate->id)
                ->with('design:id,kind')
                ->get()
                ->map(fn (GadEventCertificate $other): string => $other->design->kind->title())
                ->values()
                ->all(),
            'requests' => CertificateRequestResource::collection($requests),
            'holders' => CertificateHolderResource::collection(PageRange::within($holders
                ->with(['region:id,name', 'withdrawer:id,name'])
                ->orderBy('name')
                ->orderBy('id')
                ->paginate(20)
                ->withQueryString())),
            'filters' => $filters,
            ...PlaceFilters::options($user, $filters),
            'nationalAccess' => (bool) $user->national_access,
        ]);
    }

    /** Taken off the event, before release only. */
    public function destroy(GadEventCertificate $eventCertificate, ManageEventCertificate $manager): RedirectResponse
    {
        $design = $eventCertificate->certificate_design_id;
        $manager->detach($eventCertificate);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __('Removed from the event.')]);

        return to_route('settings.certificates.show', $design);
    }

    public function release(Request $request, GadEventCertificate $eventCertificate, ManageEventCertificate $manager): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        // Every kind the event gives goes out together.
        $issued = $manager->releaseTogether($user, $eventCertificate);

        Inertia::flash('toast', ['type' => 'success', 'message' => trans_choice(
            '{1} Gave 1 certificate. Its holder was notified.|[2,*] Gave :count certificates. Their holders were notified.',
            $issued,
        )]);

        return back();
    }

    public function refresh(GadEventCertificate $eventCertificate, ManageEventCertificate $manager): RedirectResponse
    {
        $renamed = $manager->refresh($eventCertificate);

        Inertia::flash('toast', ['type' => 'success', 'message' => trans_choice(
            '{0} Released certificates updated.|{1} Released certificates updated, and 1 holder\'s name or affiliation.|[2,*] Released certificates updated, and :count holders\' names or affiliations.',
            $renamed,
        )]);

        return back();
    }

    public function status(CertificateStatusRequest $request, GadEventCertificate $eventCertificate, Certificate $certificate, ManageEventCertificate $manager): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($request->boolean('withdrawn')) {
            $manager->withdraw($user, $certificate);
            Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':number withdrawn. Its verify page now says so.', ['number' => $certificate->number])]);
        } else {
            $manager->restore($certificate);
            Inertia::flash('toast', ['type' => 'success', 'message' => __(':number restored.', ['number' => $certificate->number])]);
        }

        return back();
    }
}
