<?php

namespace App\Http\Controllers;

use App\Http\Resources\CertificateVerificationResource;
use App\Models\Certificate;
use App\Support\CertificateNumber;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * The public verify page a certificate's QR opens: whether the number is a
 * certificate PHLGADIS gave, to whom and for what, and whether it still
 * stands (docs/certificates.md). Numbers are random, so the page can't be
 * walked through, and it is kept out of search engines.
 */
class CertificateVerificationController extends Controller
{
    public function show(Request $request, ?string $number = null): Response
    {
        $parsed = $number !== null ? CertificateNumber::parse($number) : null;
        $certificate = $parsed !== null
            ? Certificate::query()->with('eventCertificate:id,snapshot')->where('number', $parsed)->first()
            : null;

        $response = Inertia::render('certificates/verify', [
            'number' => $parsed ?? $number,
            'certificate' => $certificate !== null ? CertificateVerificationResource::make($certificate)->resolve($request) : null,
        ])->toResponse($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }
}
