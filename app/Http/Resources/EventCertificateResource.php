<?php

namespace App\Http\Resources;

use App\Models\GadEventCertificate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A design used on a GAD event, as the design's page and the release page
 * show it. Load `design`, `event.region` and `releaser` first;
 * `eligible_count` (people checked in), `certificates_count` and
 * `withdrawn_count` are added when selected.
 *
 * @mixin GadEventCertificate
 */
class EventCertificateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $design = $this->design;
        $event = $this->event;

        return [
            'id' => $this->id,
            'kind' => $design?->kind->value,
            'title' => $design?->kind->title(),
            'design' => $design !== null ? ['id' => $design->id, 'name' => $design->name] : null,
            'event' => $event !== null ? [
                ...$event->toCalendarArray(),
                'region' => $event->region?->name,
            ] : null,
            'released_at' => $this->released_at?->toIso8601ZuluString(),
            'released_by' => $this->releaser?->name,
            'eligible' => $this->whenHas('eligible_count', fn (): int => (int) $this->getAttribute('eligible_count')),
            'issued' => $this->whenCounted('certificates'),
            'withdrawn' => $this->whenHas('withdrawn_count', fn (): int => (int) $this->getAttribute('withdrawn_count')),
            'can' => [
                'release' => $request->user()?->can('release', $this->resource) ?? false,
            ],
        ];
    }
}
