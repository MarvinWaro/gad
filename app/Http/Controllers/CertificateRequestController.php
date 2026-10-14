<?php

namespace App\Http\Controllers;

use App\Actions\Certificates\ManageCertificateRequest;
use App\Http\Requests\Settings\DecideCertificateRequestRequest;
use App\Http\Requests\StoreCertificateRequestRequest;
use App\Models\CertificateRequest;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/**
 * Certificates for people who missed a day (docs/certificates.md): asking
 * from the event's page, and the office answering on the release page. The
 * rules live in ManageCertificateRequest.
 */
class CertificateRequestController extends Controller
{
    public function store(StoreCertificateRequestRequest $request, GadEvent $event, ManageCertificateRequest $requests): RedirectResponse
    {
        /** @var User $person */
        $person = $request->user();
        $use = $request->eventCertificate()->setRelation('event', $event);
        $requests->request($person, $use, $request->reason());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Request sent. You\'ll be told once CHED answers it.')]);

        return back();
    }

    public function update(DecideCertificateRequestRequest $request, GadEventCertificate $eventCertificate, CertificateRequest $certificateRequest, ManageCertificateRequest $requests): RedirectResponse
    {
        /** @var User $staff */
        $staff = $request->user();
        $certificateRequest->setRelation('eventCertificate', $eventCertificate)->load('user');

        if ($request->approves()) {
            $requests->approve($staff, $certificateRequest);
            Inertia::flash('toast', ['type' => 'success', 'message' => __(':name has the certificate now.', ['name' => $certificateRequest->user->name])]);
        } else {
            $requests->decline($staff, $certificateRequest, $request->note());
            Inertia::flash('toast', ['type' => 'success', 'message' => __('Request declined. :name was told.', ['name' => $certificateRequest->user->name])]);
        }

        return back();
    }
}
