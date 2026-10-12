<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Certificates\ManageEventCertificate;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\CertificateFilterRequest;
use App\Http\Requests\Settings\CertificateStatusRequest;
use App\Http\Resources\CertificateHolderResource;
use App\Http\Resources\EventCertificateResource;
use App\Models\Certificate;
use App\Models\GadEventCertificate;
use App\Models\User;
use App\Support\PageRange;
use App\Support\PlaceFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * An event's certificate (docs/certificates.md): releasing it to everyone
 * checked in, the people given it, and withdrawing one given by mistake. The
 * rules live in ManageEventCertificate.
 */
class EventCertificateController extends Controller
{
    public function show(CertificateFilterRequest $request, GadEventCertificate $eventCertificate): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->filters();
        $search = $filters['search'] ?? '';
        $eventCertificate->load(['design', 'event.region:id,name', 'releaser:id,name'])
            ->loadCount(['certificates', 'certificates as withdrawn_count' => fn (Builder $query) => $query->whereNotNull('withdrawn_at')]);
        $eventCertificate->setAttribute('eligible_count', $eventCertificate->eligibleUsers()->count());
        $awaiting = $eventCertificate->awaitingUsers()->count();

        $holders = Certificate::query()
            ->whereBelongsTo($eventCertificate, 'eventCertificate')
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                ->orWhere('number', 'like', '%'.addcslashes($search, '%_\\').'%')));
        PlaceFilters::apply($holders, $filters);

        return Inertia::render('settings/event-certificate', [
            'certificate' => EventCertificateResource::make($eventCertificate)->resolve($request),
            'awaiting' => $awaiting,
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
        $issued = $manager->release($user, $eventCertificate);

        Inertia::flash('toast', ['type' => 'success', 'message' => trans_choice(
            '{1} Released to 1 person, who was notified.|[2,*] Released to :count people, who were notified.',
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
