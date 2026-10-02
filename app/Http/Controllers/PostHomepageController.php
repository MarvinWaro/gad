<?php

namespace App\Http\Controllers;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Requests\UpdatePostHomepageRequest;
use App\Models\Post;
use App\Services\ActivityRecorder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

/**
 * A moderator keeps a post off the public homepage's stories, or lets it
 * back. The post itself stays in Gender Mainstreaming either way.
 */
class PostHomepageController extends Controller
{
    public function __invoke(UpdatePostHomepageRequest $request, Post $post, ActivityRecorder $activity): RedirectResponse
    {
        $hidden = $request->boolean('hidden');
        $post->forceFill(['homepage_hidden_at' => $hidden ? now() : null])->save();
        $activity->record(ActivityAction::Updated, ActivityModule::Community, $post, properties: [
            'homepage' => $hidden ? 'hidden' : 'shown',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $hidden
                ? __('The post is hidden from the homepage.')
                : __('The post can appear on the homepage again.'),
        ]);

        return back();
    }
}
