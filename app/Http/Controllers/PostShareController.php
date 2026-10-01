<?php

namespace App\Http\Controllers;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Post;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Shares a post into the community feed with an optional message. Sharing a
 * share passes along the original, so posts never nest inside each other.
 */
class PostShareController extends Controller
{
    public function __invoke(Request $request, Post $post, ActivityRecorder $activity, Notifier $notifier): RedirectResponse
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
        $notifier->postShared($original, $activity->record(ActivityAction::Shared, ActivityModule::Community, $original));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Shared to the community feed.')]);

        return back();
    }
}
