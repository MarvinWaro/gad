<?php

use App\Models\Post;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake('public');
});

test('members upload a profile photo, shared with every page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('me.jpg', 400, 400)])
        ->assertRedirect(route('profile.edit'))
        ->assertSessionHasNoErrors();

    $path = $user->fresh()->avatar_path;

    expect($path)->toStartWith('avatars/');
    Storage::disk('public')->assertExists($path);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.avatar', Storage::disk('public')->url($path))
            ->missing('auth.user.avatar_path'));
});

test('a new photo replaces the old file, and removing it deletes the file', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('one.png', 200, 200)]);
    $first = $user->fresh()->avatar_path;

    $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('two.png', 200, 200)]);
    $second = $user->fresh()->avatar_path;

    Storage::disk('public')->assertMissing($first);
    Storage::disk('public')->assertExists($second);

    // Back to the page the photo was changed on: Settings, or My Profile.
    $this->actingAs($user)
        ->from(route('my-profile'))
        ->delete(route('profile.avatar.destroy'))
        ->assertRedirect(route('my-profile'));

    expect($user->fresh()->avatar_path)->toBeNull();
    Storage::disk('public')->assertMissing($second);
});

test('profile photos are validated', function (array $payload) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('profile.avatar.update'), $payload)
        ->assertSessionHasErrors('avatar');

    expect($user->fresh()->avatar_path)->toBeNull();
})->with([
    'missing' => [[]],
    'not a photo' => [['avatar' => UploadedFile::fake()->create('cv.pdf', 20, 'application/pdf')]],
    'too large' => [['avatar' => UploadedFile::fake()->image('big.jpg', 800, 800)->size(3000)]],
    'too small' => [['avatar' => UploadedFile::fake()->image('tiny.png', 32, 32)]],
]);

test('guests cannot change a profile photo', function () {
    $this->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('me.jpg', 200, 200)])
        ->assertRedirect(route('login'));
});

test('the feed shows authors with their photo', function () {
    $this->seed(RbacSeeder::class);
    $author = User::factory()->create([
        'survey_hei_id' => createSurveyHei()->id,
        'avatar_path' => 'avatars/rhyemann.jpg',
    ]);
    $author->assignRole('hei');
    $post = Post::query()->create(['user_id' => $author->id, 'survey_hei_id' => $author->survey_hei_id, 'body' => 'Hello']);
    $post->comments()->create(['user_id' => $author->id, 'body' => 'First!']);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.author.avatar', Storage::disk('public')->url('avatars/rhyemann.jpg'))
            ->where('posts.data.0.comments.0.author.avatar', Storage::disk('public')->url('avatars/rhyemann.jpg'))));
});

test('deleting an account deletes its photo', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post(route('profile.avatar.update'), ['avatar' => UploadedFile::fake()->image('me.jpg', 200, 200)]);
    $path = $user->fresh()->avatar_path;

    $user->fresh()->delete();

    Storage::disk('public')->assertMissing($path);
});
