<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Models\Post;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Throwable;

class PostController extends Controller
{
    public function store(StorePostRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var array<int, UploadedFile> $files */
        $files = $request->file('images', []);
        $paths = array_map(fn (UploadedFile $file): string => (string) $file->store('posts', 'public'), $files);

        try {
            DB::transaction(function () use ($request, $user, $paths): void {
                $post = Post::query()->create([
                    'user_id' => $user->id,
                    'survey_hei_id' => $user->survey_hei_id,
                    'body' => $request->validated('body'),
                ]);

                foreach ($paths as $index => $path) {
                    $post->images()->create(['path' => $path, 'sort_order' => $index]);
                }
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($paths);

            throw $exception;
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post shared.')]);

        return back();
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        Gate::authorize('update', $post);

        $validated = $request->validate([
            'body' => ['nullable', 'string', 'max:5000'],
        ]);

        if (($validated['body'] ?? null) === null && ! $post->images()->exists()) {
            throw ValidationException::withMessages([
                'body' => __('Write something or add a photo.'),
            ]);
        }

        $post->update(['body' => $validated['body'] ?? null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post updated.')]);

        return back();
    }

    public function destroy(Post $post): RedirectResponse
    {
        Gate::authorize('delete', $post);

        $paths = $post->images()->pluck('path')->all();
        $post->delete();
        Storage::disk('public')->delete($paths);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post removed.')]);

        return back();
    }
}
