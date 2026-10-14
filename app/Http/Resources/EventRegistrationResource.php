<?php

namespace App\Http\Resources;

use App\Models\GadEventRegistration;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Someone who joined a GAD event, as the staff list and a future API send
 * it: who they are and where they belong, as GadEventCheckInResource shows
 * a person, when they joined, and whether staff added them. Never their
 * participant code, email, mobile or sex. `days_attended` is added when
 * selected, and `days` (the days they came, Y-m-d) when set. Load RELATIONS
 * first.
 *
 * @mixin GadEventRegistration
 */
class EventRegistrationResource extends JsonResource
{
    /** What toArray reads, for eager loading. */
    public const RELATIONS = [
        'user:id,name,avatar_path,survey_hei_id,survey_region_id',
        'user.hei:id,name',
        'user.officeRegion:id,name',
        'region:id,name',
    ];

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $person = $this->user;

        return [
            'id' => $this->id,
            'joined_at' => $this->joined_at->toIso8601ZuluString(),
            'person' => [
                'name' => $person?->name,
                'avatar' => $person?->avatar,
                'affiliation' => $person?->affiliation(),
                // An HEI's region; a staff member's affiliation already
                // names their office.
                'region' => $this->survey_hei_id !== null ? $this->region?->name : null,
            ],
            // Put on the list by staff, such as an invitee or a walk-in.
            'added' => $this->added_by !== null,
            'days_attended' => $this->whenHas('days_attended', fn (): int => (int) $this->getAttribute('days_attended')),
            'days' => $this->whenHas('days'),
        ];
    }
}
