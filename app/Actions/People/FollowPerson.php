<?php

namespace App\Actions\People;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use Illuminate\Support\Facades\DB;

/**
 * Following someone, and stopping. A follow is told to the person followed;
 * taking it back takes that notice away. Following twice, or stopping when
 * not following, changes nothing and is not logged.
 *
 * @phpstan-type FollowState array{following: bool, followers_count: int}
 */
final class FollowPerson
{
    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    /** @return FollowState */
    public function follow(User $follower, User $person): array
    {
        // Two requests at once cannot follow twice.
        $inserted = DB::table('follows')->insertOrIgnore([
            'follower_id' => $follower->id,
            'followed_id' => $person->id,
            'created_at' => now(),
        ]);

        if ($inserted > 0) {
            $entry = $this->activity->record(ActivityAction::Followed, ActivityModule::People, $person, actor: $follower);
            $this->notifier->userFollowed($person, $entry);
        }

        return $this->state($follower, $person);
    }

    /** @return FollowState */
    public function unfollow(User $follower, User $person): array
    {
        $deleted = DB::table('follows')
            ->where('follower_id', $follower->id)
            ->where('followed_id', $person->id)
            ->delete();

        if ($deleted > 0) {
            $this->activity->record(ActivityAction::Unfollowed, ActivityModule::People, $person, actor: $follower);
            $this->notifier->followWithdrawn($follower, $person);
        }

        return $this->state($follower, $person);
    }

    /** @return FollowState */
    private function state(User $follower, User $person): array
    {
        return [
            'following' => $person->followers()->whereKey($follower->id)->exists(),
            'followers_count' => $person->followers()->active()->count(),
        ];
    }
}
