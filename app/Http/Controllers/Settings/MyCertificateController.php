<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Resources\MyCertificateResource;
use App\Models\Certificate;
use App\Models\User;
use App\Support\PageRange;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings → My certificates: the certificates released to you for the GAD
 * events you were checked in to, newest first, to download as PDFs
 * (docs/certificates.md). Withdrawn ones leave the list.
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

        return Inertia::render('settings/my-certificates', [
            'certificates' => MyCertificateResource::collection($certificates),
        ]);
    }
}
