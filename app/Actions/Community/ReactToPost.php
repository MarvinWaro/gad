<?php

namespace App\Actions\Community;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\PostReactionType;
use App\Models\Post;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;

/**
 * Gives, changes, or takes back a member's reaction to a post. A member has
 * one reaction per post, so a new one replaces the old. The web feed calls
 * it today; a versioned API can call the same code.
 */
class ReactToPost
{
    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    public function set(User $member, Post $post, PostReactionType $reaction): void
    {
        $given = $post->reactions()->updateOrCreate(
            ['user_id' => $member->id],
            ['type' => $reaction],
        );
        $entry = $this->activity->record(ActivityAction::Reacted, ActivityModule::Community, $post, actor: $member, properties: [
            'reaction' => $reaction->value,
        ]);
        $this->notifier->postReacted($post, $member, $entry, first: $given->wasRecentlyCreated);
    }

    public function remove(User $member, Post $post): void
    {
        if ($post->reactions()->where('user_id', $member->id)->delete() > 0) {
            $this->activity->record(ActivityAction::Unreacted, ActivityModule::Community, $post, actor: $member);
            $this->notifier->reactionWithdrawn($post, $member);
        }
    }
}
