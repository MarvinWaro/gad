<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Support\CommunityFeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/** Comments answer with JSON, like likes, so a thread updates in place. */
class PostCommentController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ], [
            'body.required' => __('Write a comment first.'),
        ]);

        $comment = $post->comments()->create([
            'user_id' => $user->id,
            'body' => $validated['body'],
        ]);
        $comment->setRelation('author', $user);

        return response()->json([
            'comment' => CommunityFeed::presentComment($comment, $user),
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
