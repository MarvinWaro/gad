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
}
