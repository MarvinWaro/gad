<?php

namespace App\Support;

use App\Http\Resources\PersonProfileResource;
use App\Http\Resources\PersonResource;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * What a profile page shows, your own or anyone else's: who they are and
 * their follower counts, their achievements greatest first, and their posts
 * (deferred, loading more as the reader scrolls). Your own adds the badges
 * you can still earn; MyProfileController adds your activity.
 */
class ProfilePage
{
    /** @return array<string, mixed> */
    public static function props(Request $request, User $person): array
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $own = $viewer->is($person);

        $person->load(['hei:id,name', 'officeRegion:id,name'])
            ->loadCount([
                'followers as followers_count' => fn ($query) => $query->active(),
                'following as following_count' => fn ($query) => $query->active(),
            ])
            ->loadExists(PersonResource::viewerFlags($viewer));

        return [
            'own' => $own,
            'person' => PersonProfileResource::make($person)->resolve($request),
            'achievements' => fn (): array => Achievements::for($person),
            'toEarn' => fn (): array => $own ? Achievements::toEarn($person) : [],
            'posts' => Inertia::scroll(fn () => CommunityFeed::page($viewer, author: $person))->defer(),
        ];
    }
}
