<?php

namespace App\Http\Resources;

use App\Models\CertificateRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A request for a certificate, as its office's release page and its asker's
 * event page show it: which certificate, why, where it stands, and the
 * office's note if it declined. `title` comes with `eventCertificate.design`
 * loaded, and `person` and `days` for staff, when loaded and set.
 *
 * @mixin CertificateRequest
 */
class CertificateRequestResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'certificate_id' => $this->gad_event_certificate_id,
            // Its kind, such as "Certificate of Appearance", when its design is loaded.
            'title' => $this->whenLoaded('eventCertificate', fn (): ?string => $this->eventCertificate->relationLoaded('design')
                ? $this->eventCertificate->design?->kind->title()
                : null),
            'reason' => $this->reason,
            'status' => $this->status->value,
            'note' => $this->note,
            'requested_at' => $this->created_at->toIso8601ZuluString(),
            'decided_at' => $this->decided_at?->toIso8601ZuluString(),
            'person' => $this->whenLoaded('user', fn (): array => [
                'name' => $this->user->name,
                'avatar' => $this->user->avatar,
                'affiliation' => $this->user->affiliation(),
            ]),
            // The days they were checked in, Y-m-d.
            'days' => $this->whenHas('days'),
        ];
    }
}
