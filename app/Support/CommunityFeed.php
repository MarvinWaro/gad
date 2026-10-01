<?php

namespace App\Support;

use App\Enums\PostReactionType;
use App\Enums\UserStatus;
use App\Models\Post;
use App\Models\PostAchieveItem;
use App\Models\PostComment;
use App\Models\PostImage;
use App\Models\PostReaction;
use App\Models\PostSdg;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Builds the community feed as the viewer sees it: newest first, with their
 * own reaction and the actions they are allowed to take.
 */
class CommunityFeed
{
    /** Posts per page: few enough to arrive quickly on a slow connection. */
    public const PER_PAGE = 5;

    /** Latest comment threads sent with each post, each with all its replies. */
    public const COMMENTS_PER_POST = 20;

    /** People named in a post's reactions tooltip; the full list is fetched on request. */
    public const REACTORS_SHOWN = 10;

    /**
     * A page of the feed, or of one author's posts for their profile.
     *
     * @return Paginator<int, array<string, mixed>>
     */
    public static function page(User $viewer, ?User $author = null): Paginator
    {
        return self::query($viewer)
            ->when($author, fn (Builder $query, User $author) => $query->where('user_id', $author->id))
            ->latest()
            ->latest('id')
            ->simplePaginate(self::PER_PAGE)
            ->through(fn (Post $post): array => self::present($post, $viewer));
    }

    /**
     * One post as the viewer sees it, for its own page.
     *
     * @return array<string, mixed>
     */
    public static function one(Post $post, User $viewer): array
    {
        return self::present(self::query($viewer)->whereKey($post->id)->firstOrFail(), $viewer);
    }

    /**
     * How many posts would come before the given one in the viewer's feed
     * (newest first, then by id), so a reader coming back can be offered
     * them. Compared by posting time rather than by ULID, so posts carried
     * over with their original dates never count as new.
     */
    public static function newerCount(User $viewer, CarbonInterface $postedAt, string $postId): int
    {
        return self::visibleTo($viewer)
            ->where(fn (Builder $query) => $query
                ->where('created_at', '>', $postedAt)
                ->orWhere(fn (Builder $sameSecond) => $sameSecond
                    ->where('created_at', $postedAt)
                    ->where('id', '>', $postId)))
            ->count();
    }

    /**
     * Every post the viewer's feed may show: all of them for now. Scoping the
     * feed by region belongs here, so the feed and its counts agree.
     *
     * @return Builder<Post>
     */
    private static function visibleTo(User $viewer): Builder
    {
        return Post::query();
    }

    /**
     * The viewer's reaction summary for one post, fresh from the database.
     *
     * @return array<string, mixed>
     */
    public static function reactionsOf(Post $post, User $viewer): array
    {
        return self::reactionSummary(
            self::withReactions(Post::query()->whereKey($post->getKey()), $viewer)->firstOrFail(),
        );
    }

    /**
     * Counts each reaction in SQL, adds the viewer's own, and loads the
     * latest reactors for the tooltip.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    private static function withReactions(Builder $query, User $viewer): Builder
    {
        $counts = ['reactions'];

        foreach (PostReactionType::cases() as $type) {
            $counts["reactions as {$type->value}_reactions_count"] = fn ($reactions) => $reactions->where('type', $type);
        }

        return $query
            ->withCount($counts)
            ->withMax(['reactions as viewer_reaction' => fn ($reactions) => $reactions->where('user_id', $viewer->id)], 'type')
            ->with(['reactions' => fn ($reactions) => $reactions
                ->with('user:id,name')
                ->latest('id')
                ->limit(self::REACTORS_SHOWN)]);
    }

    /**
     * Totals per reaction code, the viewer's own reaction, and the latest
     * reactors, from a post loaded through withReactions(). `recent` carries
     * only what the tooltip shows; PostReactorResource is the full listing.
     *
     * @return array{total: int, counts: array<string, int>, mine: string|null, recent: array<int, array{id: int, name: string, type: string}>}
     */
    private static function reactionSummary(Post $post): array
    {
        $counts = [];

        foreach (PostReactionType::cases() as $type) {
            $counts[$type->value] = (int) $post->getAttribute("{$type->value}_reactions_count");
        }

        $mine = $post->getAttribute('viewer_reaction');

        return [
            'total' => (int) $post->getAttribute('reactions_count'),
            'counts' => $counts,
            'mine' => is_string($mine) ? $mine : null,
            'recent' => $post->reactions
                ->map(fn (PostReaction $reaction): array => [
                    'id' => $reaction->user->id,
                    'name' => $reaction->user->name,
                    'type' => $reaction->type->value,
                ])
                ->values()
                ->all(),
        ];
    }

    /** @return Builder<Post> */
    private static function query(User $viewer): Builder
    {
        return self::withReactions(self::visibleTo($viewer), $viewer)
            ->with([
                'author:id,name,status,avatar_path',
                'hei:id,name',
                'images',
                'tags:id,name,survey_hei_id,avatar_path',
                'tags.hei:id,name',
                'sdgs',
                'achieveItems',
                'sharedPost.author:id,name,status,avatar_path',
                'sharedPost.hei:id,name',
                'sharedPost.images',
                'sharedPost.tags:id,name,survey_hei_id,avatar_path',
                'sharedPost.tags.hei:id,name',
                'sharedPost.sdgs',
                'sharedPost.achieveItems',
                'comments' => fn ($query) => $query
                    ->whereNull('parent_id')
                    ->with([
                        'author:id,name,status,avatar_path',
                        'replies.author:id,name,status,avatar_path',
                        'replies.replyTo:id,name',
                    ])
                    ->latest()
                    ->latest('id')
                    ->limit(self::COMMENTS_PER_POST),
            ])
            ->withCount([
                'comments',
                'shares',
                'comments as threads_count' => fn ($query) => $query->whereNull('parent_id'),
            ]);
    }

    /** @return array<string, mixed> */
    public static function present(Post $post, User $viewer): array
    {
        return [
            ...self::content($post),
            'edited' => $post->updated_at !== null && $post->created_at !== null
                && $post->updated_at->gt($post->created_at->addMinute()),
            'shared_post' => $post->sharedPost ? self::content($post->sharedPost) : null,
            'reactions' => self::reactionSummary($post),
            'comments_count' => (int) ($post->comments_count ?? 0),
            'shares_count' => (int) ($post->shares_count ?? 0),
            'comments' => $post->comments
                ->sortBy([['created_at', 'asc'], ['id', 'asc']])
                ->map(fn (PostComment $comment): array => self::presentComment($comment, $viewer, $post->user_id))
                ->values(),
            'has_more_comments' => (int) ($post->threads_count ?? 0) > $post->comments->count(),
            'can_edit' => $viewer->can('update', $post),
            'can_delete' => $viewer->can('delete', $post),
        ];
    }

    /**
     * What a post says and shows. A shared original is presented the same
     * way inside the post that shares it.
     *
     * @return array<string, mixed>
     */
    private static function content(Post $post): array
    {
        return [
            'id' => $post->id,
            'body' => $post->body,
            'created_at' => $post->created_at?->toIso8601String(),
            'author' => self::author($post->author),
            'hei' => $post->hei ? [
                'id' => $post->hei->id,
                'name' => $post->hei->name,
                'display_name' => InstitutionName::display($post->hei->name),
            ] : null,
            'images' => $post->images
                ->map(fn (PostImage $image): array => [
                    'id' => $image->id,
                    'url' => $image->url(),
                    'width' => $image->width,
                    'height' => $image->height,
                ])
                ->values(),
            'feeling' => $post->feeling ? [
                'value' => $post->feeling->value,
                'label' => $post->feeling->label(),
                'emoji' => $post->feeling->emoji(),
            ] : null,
            'tags' => $post->tags
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'hei' => $user->hei ? InstitutionName::display($user->hei->name) : null,
                ])
                ->values(),
            // Codes only, in their official order; the client holds the names
            // and icons (resources/js/data/sdgs.ts and achieve.ts).
            'sdgs' => $post->sdgs
                ->map(fn (PostSdg $row): int => $row->sdg->value)
                ->values(),
            'achieve_items' => $post->achieveItems
                ->sortBy(fn (PostAchieveItem $row): int => $row->item->position())
                ->map(fn (PostAchieveItem $row): string => $row->item->value)
                ->values(),
        ];
    }

    /**
     * A deactivated author's posts stay up as part of their school's record,
     * flagged so readers know the account can no longer respond.
     *
     * @return array{id: int, name: string, avatar: string|null, deactivated: bool}
     */
    private static function author(User $author): array
    {
        return [
            'id' => $author->id,
            'name' => $author->name,
            'avatar' => $author->avatar,
            'deactivated' => $author->status === UserStatus::Inactive,
        ];
    }

    /**
     * A comment with its thread. Replies come only on top-level comments;
     * `reply_to` names whom a reply answers.
     *
     * @return array<string, mixed>
     */
    public static function presentComment(PostComment $comment, User $viewer, int $postAuthorId): array
    {
        return [
            'id' => $comment->id,
            'parent_id' => $comment->parent_id,
            'body' => $comment->body,
            'created_at' => $comment->created_at?->toIso8601String(),
            'author' => self::author($comment->author),
            'reply_to' => $comment->replyTo ? [
                'id' => $comment->replyTo->id,
                'name' => $comment->replyTo->name,
            ] : null,
            'is_post_author' => $comment->user_id === $postAuthorId,
            'replies' => $comment->relationLoaded('replies')
                ? $comment->replies
                    ->map(fn (PostComment $reply): array => self::presentComment($reply, $viewer, $postAuthorId))
                    ->values()
                : [],
            'can_delete' => $viewer->can('delete', $comment),
        ];
    }
}
