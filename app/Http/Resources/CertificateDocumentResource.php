<?php

namespace App\Http\Resources;

use App\Enums\CertificateKind;
use App\Models\Certificate;
use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use App\Support\CertificateFiles;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Everything one certificate prints, for the browser to lay out as a PDF
 * (lib/certificate-pdf.ts): what it was released with, the name in capitals,
 * the days the person was checked in, and signed links to its logos and
 * e-signatures. Only for its holder and the staff who release it. Load
 * `eventCertificate` first.
 *
 * @mixin Certificate
 */
class CertificateDocumentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $release = $this->eventCertificate;
        $snapshot = $release->snapshot ?? [];
        $kind = CertificateKind::from($snapshot['kind'] ?? CertificateKind::Participation->value);

        return [
            'number' => $this->number,
            'verify_url' => route('verify.show', $this->number),
            'kind' => $kind->value,
            'title' => $kind->title(),
            'lead' => $kind->lead(),
            'name' => Certificate::printedName($this->name),
            'affiliation' => $this->affiliation,
            'background' => $snapshot['background'] ?? null,
            'body' => $snapshot['body'] ?? '',
            'event' => $snapshot['event'] ?? null,
            'office' => $snapshot['office'] ?? null,
            'days' => GadEventCheckIn::query()
                ->where('gad_event_id', $release->gad_event_id)
                ->where('user_id', $this->user_id)
                ->orderBy('attended_on')
                ->pluck('attended_on')
                ->map(fn (mixed $day): string => substr((string) $day, 0, 10))
                ->all(),
            'released_on' => $this->issued_at->setTimezone(GadEvent::TIMEZONE)->toDateString(),
            'logos' => array_map(CertificateFiles::url(...), $snapshot['logo_paths'] ?? []),
            'signatories' => array_map(fn (array $signatory): array => [
                'name' => $signatory['name'],
                'position' => $signatory['position'],
                'signature' => CertificateFiles::url($signatory['signature_path']),
            ], $snapshot['signatories'] ?? []),
        ];
    }
}
