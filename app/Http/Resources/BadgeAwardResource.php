<?php

namespace App\Http\Resources;

use App\Models\BadgeAward;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Someone holding a badge, as the badge's page lists them. Load
 * `user.hei`, `user.officeRegion` and `awarder` first.
 *
 * @mixin BadgeAward
 */
class BadgeAwardResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $this->user;

        return [
            'id' => $this->id,
            'person' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar' => $user->avatar,
                'place' => $user->affiliation(),
            ],
            'awarded_by' => $this->awarder?->name,
            'note' => $this->note,
            'awarded_at' => $this->awarded_at->toIso8601ZuluString(),
        ];
    }
}
