<?php

namespace App\Http\Resources;

use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Someone given an event's certificate, as its release page lists them:
 * the name and affiliation it prints, where they belonged, and whether it
 * was withdrawn. Load `region` and `withdrawer` first.
 *
 * @mixin Certificate
 */
class CertificateHolderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'name' => $this->name,
            'affiliation' => $this->affiliation,
            'region' => $this->region?->name,
            // A guest without an account, whose certificate staff hand over.
            'guest' => $this->gad_event_guest_id !== null,
            'issued_at' => $this->issued_at->toIso8601ZuluString(),
            'withdrawn_at' => $this->withdrawn_at?->toIso8601ZuluString(),
            'withdrawn_by' => $this->withdrawer?->name,
        ];
    }
}
