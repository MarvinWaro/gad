<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return $post->user_id === $user->id;
    }

    /** Authors remove their own posts; moderators can remove any. */
    public function delete(User $user, Post $post): bool
    {
        return $post->user_id === $user->id || $user->hasPermissionTo('posts.moderate');
    }

    /**
     * Keep a post off the public homepage's stories, or let it back. Only
     * moderators, and only for posts that could appear: originals with
     * photos.
     */
    public function hideFromHomepage(User $user, Post $post): bool
    {
        return $user->hasPermissionTo('posts.moderate')
            && $post->shared_post_id === null
            // The feed has the photos loaded already; ask only when not.
            && ($post->relationLoaded('images') ? $post->images->isNotEmpty() : $post->images()->exists());
    }
}
