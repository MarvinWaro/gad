<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Shares a post into the community feed with an optional message. Sharing a
 * share passes along the original, so posts never nest inside each other.
 */
class PostShareController extends Controller
{
    public function __invoke(Request $request, Post $post): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
        ]);

        $original = $post->shared_post_id !== null
            ? $post->sharedPost()->firstOrFail()
            : $post;

        Post::query()->create([
            'user_id' => $user->id,
            'survey_hei_id' => $user->survey_hei_id,
            'body' => $validated['body'] ?? null,
            'shared_post_id' => $original->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Shared to the community feed.')]);

        return back();
    }
}
