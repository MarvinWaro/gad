<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Resources\JoinedEventResource;
use App\Http\Resources\MyCertificateResource;
use App\Models\Certificate;
use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use App\Models\GadEventRegistration;
use App\Models\User;
use App\Support\PageRange;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings → My certificates: the certificates released to you for the GAD
 * events you were checked in to, newest first, to download as PDFs
 * (docs/certificates.md); withdrawn ones leave the list. Then the events you
 * joined, how each went, and whether it gave you a certificate
 * (docs/event-registration.md).
 */
class MyCertificateController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $certificates = PageRange::within(Certificate::query()
            ->where('user_id', $user->id)
            ->whereNull('withdrawn_at')
            ->with('eventCertificate:id,gad_event_id,snapshot')
            ->latest('issued_at')
            ->latest('id')
            ->paginate(12)
            ->withQueryString());

        $events = PageRange::within(GadEventRegistration::query()
            ->where('user_id', $user->id)
            ->with('event.region:id,name')
            ->addSelect([
                'days_attended' => GadEventCheckIn::query()
                    ->selectRaw('count(*)')
                    ->whereColumn('gad_event_check_ins.gad_event_id', 'gad_event_registrations.gad_event_id')
                    ->whereColumn('gad_event_check_ins.user_id', 'gad_event_registrations.user_id'),
                'has_certificate' => Certificate::query()
                    ->selectRaw('1')
                    ->join('gad_event_certificates', 'gad_event_certificates.id', '=', 'certificates.gad_event_certificate_id')
                    ->whereColumn('gad_event_certificates.gad_event_id', 'gad_event_registrations.gad_event_id')
                    ->whereColumn('certificates.user_id', 'gad_event_registrations.user_id')
                    ->whereNull('certificates.withdrawn_at')
                    ->limit(1),
            ])
            ->orderByDesc(GadEvent::query()->select('starts_at')->whereColumn('gad_events.id', 'gad_event_registrations.gad_event_id'))
            ->latest('id')
            ->paginate(10, pageName: 'events_page')
            ->withQueryString());

        return Inertia::render('settings/my-certificates', [
            'certificates' => MyCertificateResource::collection($certificates),
            'events' => JoinedEventResource::collection($events),
        ]);
    }
}
