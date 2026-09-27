<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Support\CommunityFeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Comments answer with JSON, like likes, so a thread updates in place. */
class PostCommentController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
            // Replying: the comment being answered, on this same post.
            'parent_id' => ['nullable', 'integer', Rule::exists('post_comments', 'id')->where('post_id', $post->id)],
        ], [
            'body.required' => __('Write a comment first.'),
            'parent_id.exists' => __('That comment is no longer available.'),
        ]);

        $answered = isset($validated['parent_id'])
            ? PostComment::query()->findOrFail($validated['parent_id'])
            : null;

        $comment = $post->comments()->create([
            'user_id' => $user->id,
            'body' => $validated['body'],
            // Threads are one level deep: a reply to a reply joins the same
            // thread, naming the person it answers.
            'parent_id' => $answered?->parent_id ?? $answered?->id,
            'reply_to_user_id' => $answered !== null && $answered->user_id !== $user->id
                ? $answered->user_id
                : null,
        ]);
        $comment->setRelation('author', $user);
        $comment->load('replyTo:id,name');

        return response()->json([
            'comment' => CommunityFeed::presentComment($comment, $user, $post->user_id),
            'comments_count' => $post->comments()->count(),
        ], 201);
    }

    public function destroy(PostComment $comment): JsonResponse
    {
        Gate::authorize('delete', $comment);

        $post = $comment->post;
        $comment->delete();

        return response()->json([
            'comments_count' => $post->comments()->count(),
        ]);
    }
}
