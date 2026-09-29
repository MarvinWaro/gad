<?php

namespace App\Models;

use App\Enums\PostReactionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One member's reaction to a post. A member has at most one per post;
 * choosing another replaces it.
 *
 * @property int $id
 * @property string $post_id
 * @property int $user_id
 * @property PostReactionType $type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['post_id', 'user_id', 'type'])]
class PostReaction extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => PostReactionType::class,
        ];
    }

    /** @return BelongsTo<Post, $this> */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
