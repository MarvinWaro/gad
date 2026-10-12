<?php

namespace App\Http\Resources;

use App\Enums\CertificateKind;
use App\Models\Certificate;
use App\Models\GadEventCertificate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One of someone's own certificates, as Settings → My certificates lists
 * it: what it is for, from what it was released with. Load
 * `eventCertificate` first.
 *
 * @mixin Certificate
 */
class MyCertificateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $snapshot = $this->eventCertificate?->snapshot;
        $kind = CertificateKind::tryFrom($snapshot['kind'] ?? '');

        return [
            'id' => $this->id,
            'number' => $this->number,
            'kind' => $kind?->value,
            'title' => $kind?->title(),
            'event' => $snapshot['event'] ?? null,
            'office' => $snapshot !== null ? GadEventCertificate::officeName($snapshot['office']) : null,
            'issued_at' => $this->issued_at->toIso8601ZuluString(),
            'verify_url' => route('verify.show', $this->number),
        ];
    }
}
