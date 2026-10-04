<?php

namespace App\Enums;

use App\Models\GadEvent;
use App\Models\Post;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * How a system badge is earned: milestones in sharing GAD work, so one rich
 * post earns one badge and the rest take time. Only the person's own posts
 * count, never shares; a deleted post no longer counts, but a badge once
 * earned stays (docs/badges.md). The codes are stored and sent to the
 * browser and the API as they are; never reuse one.
 */
enum BadgeRule: string
{
    case CommunitySpark = 'community-spark';
    case VisualStoryteller = 'visual-storyteller';
    case SdgConnector = 'sdg-connector';
    case AgendaBuilder = 'agenda-builder';

    /** Days, in Philippine time, with a tagged photo post. */
    public const STORY_DAYS = 5;

    /** Different SDGs supported. */
    public const SDGS = 5;

    /** Different A.C.H.I.E.V.E. items supported. */
    public const AGENDA_ITEMS = 4;

    /** How it is earned, as the badge list says it. */
    public function criterion(): string
    {
        return match ($this) {
            self::CommunitySpark => 'A first photo post tagged with an SDG or an A.C.H.I.E.V.E. item',
            self::VisualStoryteller => sprintf('Tagged photo posts on %d different days', self::STORY_DAYS),
            self::SdgConnector => sprintf('Posts supporting %d different SDGs', self::SDGS),
            self::AgendaBuilder => sprintf('Posts supporting %d different A.C.H.I.E.V.E. items', self::AGENDA_ITEMS),
        };
    }

    public function isMetBy(User $user): bool
    {
        return match ($this) {
            self::CommunitySpark => self::storyPosts($user)->exists(),
            self::VisualStoryteller => self::storyDays($user) >= self::STORY_DAYS,
            self::SdgConnector => self::goalsOf($user, 'post_sdgs', 'sdg') >= self::SDGS,
            self::AgendaBuilder => self::goalsOf($user, 'post_achieve_items', 'item') >= self::AGENDA_ITEMS,
        };
    }

    /**
     * The person's own photo posts tagged with an SDG or an agenda item: the
     * GAD work the dashboard's goals section counts.
     *
     * @return Builder<Post>
     */
    private static function storyPosts(User $user): Builder
    {
        return Post::query()
            ->where('user_id', $user->id)
            ->whereNull('shared_post_id')
            ->whereHas('images')
            ->where(fn (Builder $query) => $query->whereHas('sdgs')->orWhereHas('achieveItems'));
    }

    /** Different days, in Philippine time, with such a post. One person's posts are few. */
    private static function storyDays(User $user): int
    {
        return self::storyPosts($user)
            ->pluck('created_at')
            ->map(fn (CarbonInterface $at): string => $at->setTimezone(GadEvent::TIMEZONE)->toDateString())
            ->unique()
            ->count();
    }

    /** How many different goals of one kind the person's own posts support. */
    private static function goalsOf(User $user, string $table, string $column): int
    {
        return DB::table($table)
            ->join('posts', 'posts.id', '=', "{$table}.post_id")
            ->where('posts.user_id', $user->id)
            ->whereNull('posts.shared_post_id')
            ->distinct()
            ->count("{$table}.{$column}");
    }
}
