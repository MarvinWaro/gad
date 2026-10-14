<?php

namespace App\Http\Controllers;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Resources\CertificateDocumentResource;
use App\Models\Certificate;
use App\Services\ActivityRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * What one certificate prints, as JSON, for the browser to make its PDF
 * (lib/certificate-pdf.ts): for its holder, from My certificates, and for
 * the staff who release it, to print it on request. Each download is logged.
 */
class CertificateDocumentController extends Controller
{
    public function show(Request $request, Certificate $certificate, ActivityRecorder $activity): JsonResponse
    {
        $certificate->load('eventCertificate:id,gad_event_id,snapshot');
        $activity->record(ActivityAction::Downloaded, ActivityModule::Certificates, $certificate);

        return response()->json(CertificateDocumentResource::make($certificate)->resolve($request));
    }
}
