<?php

namespace App\Http\Resources;

use App\Enums\CertificateKind;
use App\Models\Certificate;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A certificate as the public verify page shows it to whoever holds its
 * number: what it was given for, to whom, by which office, and whether it
 * still stands. Never the holder's account, email or participant code.
 * Load `eventCertificate` first.
 *
 * @mixin Certificate
 */
class CertificateVerificationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $snapshot = $this->eventCertificate->snapshot ?? [];
        $kind = CertificateKind::tryFrom($snapshot['kind'] ?? '');

        return [
            'number' => $this->number,
            'status' => $this->isWithdrawn() ? 'withdrawn' : 'valid',
            'kind' => $kind?->value,
            'title' => $kind?->title(),
            'name' => Certificate::printedName($this->name),
            'affiliation' => $this->affiliation,
            'event' => isset($snapshot['event']) ? [
                'title' => $snapshot['event']['title'],
                'starts_at' => $snapshot['event']['starts_at'],
                'ends_at' => $snapshot['event']['ends_at'],
                'is_all_day' => $snapshot['event']['is_all_day'],
                'location' => $snapshot['event']['location'],
            ] : null,
            'office' => GadEventCertificate::officeName($snapshot['office'] ?? null),
            'issued_on' => $this->issued_at->setTimezone(GadEvent::TIMEZONE)->toDateString(),
            'withdrawn_on' => $this->withdrawn_at?->setTimezone(GadEvent::TIMEZONE)->toDateString(),
        ];
    }
}
