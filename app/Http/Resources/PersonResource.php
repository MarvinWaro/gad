<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Someone as other members see them in search results and follower lists:
 * a name, a photo and where they belong. Never an email or a role. Load
 * `hei` and `officeRegion` first, and PersonResource::viewerFlags() for
 * whether the reader follows them.
 *
 * @mixin User
 */
class PersonResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // For links: the number never goes in an address.
            'ulid' => $this->ulid,
            'name' => $this->name,
            'avatar' => $this->avatar,
            'affiliation' => $this->affiliation(),
            'following' => (bool) $this->getAttribute('viewer_follows'),
            'follows_you' => (bool) $this->getAttribute('follows_viewer'),
            'is_you' => $request->user()?->id === $this->id,
        ];
    }

    /**
     * Whether the reader follows each person, and each person the reader,
     * for withExists() or loadExists().
     *
     * @return array<string, callable>
     */
    public static function viewerFlags(User $viewer): array
    {
        return [
            'followers as viewer_follows' => fn ($query) => $query->where('follows.follower_id', $viewer->id),
            'following as follows_viewer' => fn ($query) => $query->where('follows.followed_id', $viewer->id),
        ];
    }
}
