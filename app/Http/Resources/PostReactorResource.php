<?php

namespace App\Http\Resources;

use App\Models\PostReaction;
use App\Support\InstitutionName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One person in a post's reactions list: who they are, their school, and the
 * reaction code they chose. Load `user` and `user.hei` first.
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
            'hei' => $this->user->hei ? InstitutionName::display($this->user->hei->name) : null,
            'type' => $this->type->value,
        ];
    }
}
