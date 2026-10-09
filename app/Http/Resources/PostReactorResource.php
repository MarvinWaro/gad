<?php

namespace App\Http\Resources;

use App\Models\PostReaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One person in a post's reactions list: who they are, their school or CHED
 * office, and the reaction code they chose. Load `user`, `user.hei` and
 * `user.officeRegion` first.
 *
 * @mixin PostReaction
 */
class PostReactorResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->user->id,
            'name' => $this->user->name,
            'avatar' => $this->user->avatar,
            'affiliation' => $this->user->affiliation(),
            'type' => $this->type->value,
        ];
    }
}
