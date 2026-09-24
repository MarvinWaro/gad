<?php

namespace App\Support;

use App\Enums\UserStatus;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\PostImage;
use App\Models\User;
use Illuminate\Contracts\Pagination\Paginator;

/**
 * Builds the community feed as the viewer sees it: newest first, with their
 * own like state and the actions they are allowed to take.
 */
class CommunityFeed
{
    public const PER_PAGE = 10;

    /** Comments sent with each post; the rest load when the thread grows. */
    public const COMMENTS_PER_POST = 20;

    /** @return Paginator<int, array<string, mixed>> */
    public static function page(User $viewer): Paginator
    {
        return Post::query()
            ->with([
                'author:id,name,status',
                'hei:id,name',
                'images',
                'comments' => fn ($query) => $query
                    ->with('author:id,name,status')
                    ->latest()
                    ->latest('id')
                    ->limit(self::COMMENTS_PER_POST),
            ])
            ->withCount(['likes', 'comments'])
            ->withExists(['likes as liked' => fn ($query) => $query->where('user_id', $viewer->id)])
            ->latest()
            ->latest('id')
            ->simplePaginate(self::PER_PAGE)
            ->through(fn (Post $post): array => self::present($post, $viewer));
    }

    /** @return array<string, mixed> */
    public static function present(Post $post, User $viewer): array
    {
        return [
            'id' => $post->id,
            'body' => $post->body,
            'created_at' => $post->created_at?->toIso8601String(),
            'edited' => $post->updated_at !== null && $post->created_at !== null
                && $post->updated_at->gt($post->created_at->addMinute()),
            'author' => self::author($post->author),
            'hei' => $post->hei ? [
                'id' => $post->hei->id,
                'name' => $post->hei->name,
                'display_name' => InstitutionName::display($post->hei->name),
            ] : null,
            'images' => $post->images
                ->map(fn (PostImage $image): array => ['id' => $image->id, 'url' => $image->url()])
                ->values(),
            'likes_count' => (int) ($post->likes_count ?? 0),
            'liked' => (bool) ($post->liked ?? false),
            'comments_count' => (int) ($post->comments_count ?? 0),
            'comments' => $post->comments
                ->sortBy([['created_at', 'asc'], ['id', 'asc']])
                ->map(fn (PostComment $comment): array => self::presentComment($comment, $viewer))
                ->values(),
            'can_edit' => $viewer->can('update', $post),
            'can_delete' => $viewer->can('delete', $post),
        ];
    }

    /**
     * A deactivated author's posts stay up as part of their school's record,
     * flagged so readers know the account can no longer respond.
     *
     * @return array{id: int, name: string, deactivated: bool}
     */
    private static function author(User $author): array
    {
        return [
            'id' => $author->id,
            'name' => $author->name,
            'deactivated' => $author->status === UserStatus::Inactive,
        ];
    }

    /** @return array<string, mixed> */
    public static function presentComment(PostComment $comment, User $viewer): array
    {
        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'created_at' => $comment->created_at?->toIso8601String(),
            'author' => self::author($comment->author),
            'can_delete' => $viewer->can('delete', $comment),
        ];
    }
}
