<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A comment on a post, or a reply inside a comment's thread (one level).
 *
 * @property int $id
 * @property string $post_id
 * @property int|null $parent_id
 * @property int $user_id
 * @property int|null $reply_to_user_id
 * @property string $body
 * @property Carbon|null $created_at
 */
#[Fillable(['post_id', 'parent_id', 'user_id', 'reply_to_user_id', 'body'])]
class PostComment extends Model
{
    /** @return BelongsTo<Post, $this> */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The top-level comment whose thread this reply belongs to.
     *
     * @return BelongsTo<PostComment, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(PostComment::class, 'parent_id');
    }

    /**
     * Replies in this comment's thread, oldest first.
     *
     * @return HasMany<PostComment, $this>
     */
    public function replies(): HasMany
    {
        return $this->hasMany(PostComment::class, 'parent_id')->oldest()->oldest('id');
    }

    /**
     * The person this reply answers.
     *
     * @return BelongsTo<User, $this>
     */
    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reply_to_user_id');
    }
}
