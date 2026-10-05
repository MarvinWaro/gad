<?php

namespace App\Http\Resources;

use App\Models\BadgeAward;
use App\Models\User;
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
        return [
            'id' => $this->id,
            'person' => self::person($this->user),
            'awarded_by' => $this->awarder?->name,
            'note' => $this->note,
            'awarded_at' => $this->awarded_at->toIso8601ZuluString(),
        ];
    }

    /**
     * A holder as the list names them. Load `hei` and `officeRegion` first.
     *
     * @return array{id: int, name: string, avatar: string|null, place: string}
     */
    public static function person(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'place' => $user->affiliation(),
        ];
    }
}
