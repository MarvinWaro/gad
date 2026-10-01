<?php

namespace App\Actions\Community;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Post;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\PhotoDimensions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Publishes a community post with its photos, the people it tags, and the
 * SDGs and A.C.H.I.E.V.E. items it supports. The web form calls it today; a
 * versioned API can call the same code.
 */
class CreatePost
{
    public function __construct(private readonly ActivityRecorder $activity) {}

    /**
     * @param  array<string, mixed>  $data  Input validated by StorePostRequest: body, feeling, tags, sdgs and achieve_items.
     * @param  array<int, UploadedFile>  $images
     */
    public function handle(User $author, array $data, array $images = []): Post
    {
        $photos = array_map(fn (UploadedFile $file): array => [
            ...(PhotoDimensions::of((string) $file->getRealPath()) ?? ['width' => null, 'height' => null]),
            'path' => (string) $file->store('posts', 'public'),
        ], $images);
        $paths = array_column($photos, 'path');

        try {
            $post = DB::transaction(function () use ($author, $data, $photos): Post {
                $post = Post::query()->create([
                    'user_id' => $author->id,
                    'survey_hei_id' => $author->survey_hei_id,
                    'body' => $data['body'] ?? null,
                    'feeling' => $data['feeling'] ?? null,
                ]);

                foreach ($photos as $index => $photo) {
                    $post->images()->create([...$photo, 'sort_order' => $index]);
                }

                $post->tags()->attach((array) ($data['tags'] ?? []));
                $post->sdgs()->createMany(array_map(
                    fn (mixed $sdg): array => ['sdg' => (int) $sdg],
                    (array) ($data['sdgs'] ?? []),
                ));
                $post->achieveItems()->createMany(array_map(
                    fn (mixed $item): array => ['item' => $item],
                    (array) ($data['achieve_items'] ?? []),
                ));

                return $post;
            });
        } catch (Throwable $exception) {
            // Nothing was saved, so the stored photos have nothing to belong to.
            Storage::disk('public')->delete($paths);

            throw $exception;
        }

        $this->activity->record(ActivityAction::Created, ActivityModule::Community, $post, actor: $author, properties: array_filter([
            'photos' => count($photos),
        ]));

        return $post;
    }
}
