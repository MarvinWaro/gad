<?php

namespace App\Http\Resources;

use App\Models\GadEvent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A GAD event as the public website and a future public API send it
 * (docs/event-registration.md): what it is, when and where, whose region,
 * and whether people can still join. Times are Philippine wall-clock
 * times. Never the internal id, who added it, or anything about who joined.
 * Load `region` first.
 *
 * @mixin GadEvent
 */
class PublicEventResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $now = GadEvent::localNow();

        return [
            'ulid' => $this->ulid,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'category' => $this->category,
            'starts_at' => $this->starts_at->format('Y-m-d\TH:i:s'),
            'ends_at' => $this->ends_at?->format('Y-m-d\TH:i:s'),
            'is_all_day' => $this->is_all_day,
            // Null: for every region.
            'region' => $this->region?->name,
            'status' => $this->resource->statusAt($now),
            'registration_open' => $this->resource->acceptsRegistrations($now),
            'registration_closes_at' => $this->registration_closes_at?->format('Y-m-d\TH:i:s'),
        ];
    }
}
