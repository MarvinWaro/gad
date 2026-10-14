<?php

namespace App\Http\Resources;

use App\Models\GadEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A GAD event as its page and a future API send it: the calendar fields
 * (GadEvent::toCalendarArray), where it is for, and its registration
 * (docs/event-registration.md). `registrations_count` is added when counted.
 *
 * @mixin GadEvent
 */
class GadEventResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $now = GadEvent::localNow();

        return [
            ...$this->resource->toCalendarArray(),
            // Null: for every region.
            'region' => $this->whenLoaded('region', fn (): ?array => $this->region?->only(['id', 'name'])),
            'status' => $this->resource->statusAt($now),
            'ended' => $now->greaterThanOrEqualTo($this->resource->finishesAt()),
            'registration_open' => $this->resource->acceptsRegistrations($now),
            'joined_count' => $this->whenHas('registrations_count', fn (): int => (int) $this->getAttribute('registrations_count')),
        ];
    }
}
