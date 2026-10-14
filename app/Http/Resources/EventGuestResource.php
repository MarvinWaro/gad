<?php

namespace App\Http\Resources;

use App\Models\GadEventGuest;
use App\Models\GadEventGuestDay;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A guest without an account at an event, as its staff list and a future
 * API send them: who they are, the days they came, and which of the
 * event's certificates they hold. Load `days` and `certificates` first.
 *
 * @mixin GadEventGuest
 */
class EventGuestResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'organization' => $this->organization,
            'position' => $this->position,
            'sex' => $this->sex,
            'days' => $this->days->sortBy('attended_on')->map(fn (GadEventGuestDay $day): string => $day->attended_on)->values()->all(),
            // The event certificates (their ids) given to them.
            'certificates' => $this->certificates->pluck('gad_event_certificate_id')->values()->all(),
        ];
    }
}
