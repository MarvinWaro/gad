<?php

namespace App\Actions\Community;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\PostReactionType;
use App\Models\Post;
use App\Models\User;
use App\Services\ActivityRecorder;

/**
 * Gives, changes, or takes back a member's reaction to a post. A member has
 * one reaction per post, so a new one replaces the old. The web feed calls
 * it today; a versioned API can call the same code.
 */
class ReactToPost
{
    public function __construct(private readonly ActivityRecorder $activity) {}

    public function set(User $member, Post $post, PostReactionType $reaction): void
    {
        $post->reactions()->updateOrCreate(
            ['user_id' => $member->id],
            ['type' => $reaction],
        );
        $this->activity->record(ActivityAction::Reacted, ActivityModule::Community, $post, actor: $member, properties: [
            'reaction' => $reaction->value,
        ]);
    }

    public function remove(User $member, Post $post): void
    {
        if ($post->reactions()->where('user_id', $member->id)->delete() > 0) {
            $this->activity->record(ActivityAction::Unreacted, ActivityModule::Community, $post, actor: $member);
        }
    }
}
