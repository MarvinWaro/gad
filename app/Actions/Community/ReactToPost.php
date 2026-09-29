<?php

namespace App\Actions\Community;

use App\Enums\PostReactionType;
use App\Models\Post;
use App\Models\User;

/**
 * Gives, changes, or takes back a member's reaction to a post. A member has
 * one reaction per post, so a new one replaces the old. The web feed calls
 * it today; a versioned API can call the same code.
 */
class ReactToPost
{
    public function set(User $member, Post $post, PostReactionType $reaction): void
    {
        $post->reactions()->updateOrCreate(
            ['user_id' => $member->id],
            ['type' => $reaction],
        );
    }

    public function remove(User $member, Post $post): void
    {
        $post->reactions()->where('user_id', $member->id)->delete();
    }
}
