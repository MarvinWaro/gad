<?php

namespace App\Support;

use App\Enums\UserStatus;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostImage;
use App\Models\User;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * Builds the community feed as the viewer sees it: newest first, with their
 * own like state and the actions they are allowed to take.
 */
class CommunityFeed
{
    public const PER_PAGE = 10;

    /** Latest comment threads sent with each post, each with all its replies. */
    public const COMMENTS_PER_POST = 20;

    /** @return Paginator<int, array<string, mixed>> */
    public static function page(User $viewer): Paginator
    {
        return self::query($viewer)
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

    /** @return Builder<Post> */
    private static function query(User $viewer): Builder
    {
        return Post::query()
            ->with([
                'author:id,name,status,avatar_path',
                'hei:id,name',
                'images',
                'tags:id,name,survey_hei_id,avatar_path',
                'tags.hei:id,name',
                'sharedPost.author:id,name,status,avatar_path',
                'sharedPost.hei:id,name',
                'sharedPost.images',
                'sharedPost.tags:id,name,survey_hei_id,avatar_path',
                'sharedPost.tags.hei:id,name',
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
                'likes',
                'comments',
                'shares',
                'comments as threads_count' => fn ($query) => $query->whereNull('parent_id'),
            ])
            ->withExists(['likes as liked' => fn ($query) => $query->where('user_id', $viewer->id)]);
    }

    /** @return array<string, mixed> */
    public static function present(Post $post, User $viewer): array
    {
        return [
            ...self::content($post),
            'edited' => $post->updated_at !== null && $post->created_at !== null
                && $post->updated_at->gt($post->created_at->addMinute()),
            'shared_post' => $post->sharedPost ? self::content($post->sharedPost) : null,
            'likes_count' => (int) ($post->likes_count ?? 0),
            'liked' => (bool) ($post->liked ?? false),
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
                ->map(fn (PostImage $image): array => ['id' => $image->id, 'url' => $image->url()])
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
