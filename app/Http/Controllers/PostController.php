<?php

namespace App\Http\Controllers;

use App\Actions\Community\CreatePost;
use App\Http\Requests\StorePostRequest;
use App\Models\Post;
use App\Models\User;
use App\Support\CommunityFeed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
{
    /** A post's own page, for links shared by message or email. Members only. */
    public function show(Request $request, Post $post): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('posts/show', [
            'post' => CommunityFeed::one($post, $user),
            'feedUrl' => $this->feedUrl($user),
        ]);
    }

    public function store(StorePostRequest $request, CreatePost $createPost): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var array<int, UploadedFile> $images */
        $images = $request->file('images', []);

        $createPost->handle($user, $request->validated(), $images);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post shared.')]);

        return back();
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
        ]);

        // A share carries the original post, so its own message may be empty.
        if (($validated['body'] ?? null) === null && $post->shared_post_id === null && ! $post->images()->exists()) {
            throw ValidationException::withMessages([
                'body' => __('Write something or add a photo.'),
            ]);
        }

        $post->update(['body' => $validated['body'] ?? null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post updated.')]);

        return back();
    }

    public function destroy(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('delete', $post);

        $permalink = route('posts.show', $post);
        $paths = $post->images()->pluck('path')->all();
        $post->delete();
        Storage::disk('public')->delete($paths);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __('Post removed.')]);

        // Removed from its own page, there is nothing to go back to.
        if (url()->previous() === $permalink) {
            /** @var User $user */
            $user = $request->user();

            return redirect()->to($this->feedUrl($user));
        }

        return back();
    }

    /** Where this person reads the feed: CHED staff in the staff shell. */
    private function feedUrl(User $user): string
    {
        return $user->hasPermissionTo('posts.view') ? route('community') : route('dashboard');
    }
}
