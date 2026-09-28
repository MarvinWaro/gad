<?php

namespace App\Models;

use App\Enums\PostFeeling;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A community feed post: an HEI or CHED staff member sharing a GAD activity.
 *
 * @property string $id
 * @property int $user_id
 * @property int|null $survey_hei_id
 * @property string|null $body
 * @property PostFeeling|null $feeling
 * @property string|null $shared_post_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'survey_hei_id', 'body', 'feeling', 'shared_post_id'])]
class Post extends Model
{
    use HasUlids;

    /** Photos allowed on one post. */
    public const MAX_IMAGES = 10;

    /** People who can be tagged on one post. */
    public const MAX_TAGS = 20;

    /**
     * Sustainable Development Goals one post can support. Few enough to stay
     * meaningful in counts, and to fit one line on a photo as the UN's icon
     * guidelines ask.
     */
    public const MAX_SDGS = 3;

    /** A.C.H.I.E.V.E. Agenda items one post can support. */
    public const MAX_ACHIEVE_ITEMS = 3;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'feeling' => PostFeeling::class,
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<SurveyHei, $this> */
    public function hei(): BelongsTo
    {
        return $this->belongsTo(SurveyHei::class, 'survey_hei_id');
    }

    /** @return HasMany<PostImage, $this> */
    public function images(): HasMany
    {
        return $this->hasMany(PostImage::class)->orderBy('sort_order');
    }

    /** @return HasMany<PostComment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(PostComment::class);
    }

    /** @return BelongsToMany<User, $this> */
    public function likes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_likes')->withTimestamps();
    }

    /**
     * The original post, when this post is a share of it.
     *
     * @return BelongsTo<Post, $this>
     */
    public function sharedPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'shared_post_id');
    }

    /**
     * Shares of this post in the feed.
     *
     * @return HasMany<Post, $this>
     */
    public function shares(): HasMany
    {
        return $this->hasMany(Post::class, 'shared_post_id');
    }

    /**
     * People the author tagged, by name.
     *
     * @return BelongsToMany<User, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'post_tags')
            ->withTimestamps()
            ->orderBy('users.name');
    }

    /**
     * The Sustainable Development Goals the activity supports, by number.
     *
     * @return HasMany<PostSdg, $this>
     */
    public function sdgs(): HasMany
    {
        return $this->hasMany(PostSdg::class)->orderBy('sdg');
    }

    /**
     * The A.C.H.I.E.V.E. Agenda items the activity supports.
     *
     * @return HasMany<PostAchieveItem, $this>
     */
    public function achieveItems(): HasMany
    {
        return $this->hasMany(PostAchieveItem::class);
    }
}
