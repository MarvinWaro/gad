<?php

namespace App\Policies;

use App\Models\PostComment;
use App\Models\User;

class PostCommentPolicy
{
    /** Authors remove their own comments; moderators can remove any. */
    public function delete(User $user, PostComment $comment): bool
    {
        return $comment->user_id === $user->id || $user->hasPermissionTo('posts.moderate');
    }
}
