<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Someone holding a GAD Quest level's badge, in the shape BadgeAwardResource
 * gives every other badge's holders: earned, never awarded by hand, with the
 * quests they hold it for as the note. From App\Support\QuestBadgeHolders.
 *
 * @property array{user: User, quests: list<string>, earned_at: string} $resource
 */
class QuestBadgeHolderResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['user']->id,
            'person' => BadgeAwardResource::person($this->resource['user']),
            'awarded_by' => null,
            'note' => implode(', ', $this->resource['quests']),
            'awarded_at' => $this->resource['earned_at'],
        ];
    }
}
