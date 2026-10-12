<?php

namespace App\Http\Resources;

use App\Models\GadEventCheckIn;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A check-in at a GAD event, as the scanner shows it and a future API sends
 * it: who came and where they belong, when and how, and who checked them
 * in. Never their participant code, email, mobile or sex. Load RELATIONS
 * first.
 *
 * @mixin GadEventCheckIn
 */
class GadEventCheckInResource extends JsonResource
{
    /** What toArray reads, for eager loading. */
    public const RELATIONS = [
        'user:id,name,avatar_path,survey_hei_id,survey_region_id',
        'user.hei:id,name',
        'user.officeRegion:id,name',
        'user.roles:id,name',
        'region:id,name',
        'checker:id,name',
    ];

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $person = $this->user;

        return [
            'id' => $this->id,
            'checked_in_at' => $this->checked_in_at->toIso8601ZuluString(),
            'method' => $this->method,
            'person' => [
                'name' => $person?->name,
                'avatar' => $person?->avatar,
                'affiliation' => $person?->affiliation(),
                // An HEI's region; a staff member's affiliation already
                // names their office.
                'region' => $this->survey_hei_id !== null ? $this->region?->name : null,
                'roles' => $person?->roles->pluck('name')->values()->all() ?? [],
            ],
            'checked_in_by' => $this->checker?->name,
        ];
    }
}
