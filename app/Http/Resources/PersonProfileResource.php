<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Someone's profile header: who they are, their follower counts (active
 * accounts only) and whether the reader may follow them. Load as
 * App\Support\ProfilePage does.
 *
 * @mixin User
 */
class PersonProfileResource extends PersonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $viewer = $request->user();

        return [
            ...parent::toArray($request),
            'deactivated' => ! $this->isActive(),
            'followers_count' => (int) $this->getAttribute('followers_count'),
            'following_count' => (int) $this->getAttribute('following_count'),
            'can_follow' => $viewer !== null && $viewer->can('follow', $this->resource),
        ];
    }
}
