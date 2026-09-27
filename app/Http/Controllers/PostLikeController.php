<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Likes answer with JSON so the feed can update one card in place instead of
 * reloading every page the reader has scrolled through.
 */
class PostLikeController extends Controller
{
    public function store(Request $request, Post $post): JsonResponse
    {
        $post->likes()->syncWithoutDetaching([$request->user()->id]);

        return $this->state($post, true);
    }

    public function destroy(Request $request, Post $post): JsonResponse
    {
        $post->likes()->detach($request->user()->id);

        return $this->state($post, false);
    }

    private function state(Post $post, bool $liked): JsonResponse
    {
        return response()->json([
            'liked' => $liked,
            'likes_count' => $post->likes()->count(),
        ]);
    }
}
