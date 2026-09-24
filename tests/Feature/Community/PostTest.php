<?php

use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('public');
});

function communityMember(): User
{
    $user = User::factory()->create(['survey_hei_id' => createSurveyHei(['name' => fake()->unique()->company()])->id]);
    $user->assignRole('hei');

    return $user;
}

function communityModerator(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

function communityPost(User $author, array $attributes = []): Post
{
    return Post::query()->create([
        'user_id' => $author->id,
        'survey_hei_id' => $author->survey_hei_id,
        'body' => 'Orientation on the Safe Spaces Act for first-year students.',
        ...$attributes,
    ]);
}

test('HEI users share a post with photos, tagged with their institution', function () {
    $user = communityMember();

    $this->actingAs($user)
        ->post(route('posts.store'), [
            'body' => '18-Day Campaign culmination at the convention center.',
            'images' => [
                UploadedFile::fake()->image('stage.jpg', 1200, 800),
                UploadedFile::fake()->image('group.png', 800, 800),
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $post = Post::query()->with('images')->sole();

    expect($post->user_id)->toBe($user->id)
        ->and($post->survey_hei_id)->toBe($user->survey_hei_id)
        ->and($post->images)->toHaveCount(2)
        ->and($post->images->pluck('sort_order')->all())->toBe([0, 1]);
    Storage::disk('public')->assertExists($post->images->pluck('path')->all());
});

test('a post can be text only or photo only', function () {
    $user = communityMember();

    $this->actingAs($user)
        ->post(route('posts.store'), ['body' => 'Text only'])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('posts.store'), ['images' => [UploadedFile::fake()->image('only.jpg')]])
        ->assertSessionHasNoErrors();

    expect(Post::query()->count())->toBe(2);
});

test('posts are validated', function (array $payload, string $field) {
    $this->actingAs(communityMember())
        ->post(route('posts.store'), $payload)
        ->assertSessionHasErrors($field);

    expect(Post::query()->count())->toBe(0);
})->with([
    'empty' => [['body' => ''], 'body'],
    'too many photos' => [['images' => array_map(fn () => UploadedFile::fake()->image('p.jpg'), range(1, 5))], 'images'],
    'not a photo' => [['images' => [UploadedFile::fake()->create('report.pdf', 10, 'application/pdf')]], 'images.0'],
]);

test('likes are idempotent and report the new count', function () {
    $post = communityPost(communityMember());
    $reader = communityMember();

    $this->actingAs($reader)->postJson(route('posts.like', $post))->assertExactJson(['liked' => true, 'likes_count' => 1]);
    $this->actingAs($reader)->postJson(route('posts.like', $post))->assertExactJson(['liked' => true, 'likes_count' => 1]);
    $this->actingAs($reader)->deleteJson(route('posts.unlike', $post))->assertExactJson(['liked' => false, 'likes_count' => 0]);
});

test('the feed reflects the viewer\'s likes and permissions', function () {
    $author = communityMember();
    $post = communityPost($author);
    $post->likes()->attach($author->id);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.data.0.liked', true)
            ->where('posts.data.0.likes_count', 1)
            ->where('posts.data.0.can_edit', true)
            ->where('posts.data.0.can_delete', true));

    $this->actingAs(communityMember())
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.data.0.liked', false)
            ->where('posts.data.0.can_edit', false)
            ->where('posts.data.0.can_delete', false));
});

test('members comment, and remove only their own comments', function () {
    $post = communityPost(communityMember());
    $commenter = communityMember();

    $this->actingAs($commenter)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Congratulations!'])
        ->assertCreated()
        ->assertJsonPath('comment.body', 'Congratulations!')
        ->assertJsonPath('comment.can_delete', true)
        ->assertJsonPath('comments_count', 1);

    $this->actingAs($commenter)
        ->postJson(route('posts.comments.store', $post), ['body' => ''])
        ->assertUnprocessable();

    $comment = PostComment::query()->sole();

    $this->actingAs(communityMember())
        ->deleteJson(route('comments.destroy', $comment))
        ->assertForbidden();

    $this->actingAs($commenter)
        ->deleteJson(route('comments.destroy', $comment))
        ->assertOk()
        ->assertJsonPath('comments_count', 0);
});

test('authors edit and delete their own posts, and photos are removed', function () {
    $author = communityMember();

    $this->actingAs($author)->post(route('posts.store'), [
        'body' => 'Original',
        'images' => [UploadedFile::fake()->image('one.jpg')],
    ]);
    $post = Post::query()->with('images')->sole();
    $path = $post->images->first()->path;

    $this->actingAs($author)
        ->put(route('posts.update', $post), ['body' => 'Edited'])
        ->assertSessionHasNoErrors();
    expect($post->fresh()->body)->toBe('Edited');

    $this->actingAs(communityMember())
        ->put(route('posts.update', $post), ['body' => 'Hijacked'])
        ->assertForbidden();
    $this->actingAs(communityMember())
        ->delete(route('posts.destroy', $post))
        ->assertForbidden();

    $this->actingAs($author)->delete(route('posts.destroy', $post))->assertRedirect();

    expect(Post::query()->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($path);
});

test('a post without photos cannot be edited to empty', function () {
    $author = communityMember();
    $post = communityPost($author);

    $this->actingAs($author)
        ->put(route('posts.update', $post), ['body' => ''])
        ->assertSessionHasErrors('body');
});

test('moderators remove any post or comment', function () {
    $post = communityPost(communityMember());
    $comment = $post->comments()->create(['user_id' => communityMember()->id, 'body' => 'Spam']);
    $moderator = communityModerator();

    $this->actingAs($moderator)->deleteJson(route('comments.destroy', $comment))->assertOk();
    $this->actingAs($moderator)->delete(route('posts.destroy', $post))->assertRedirect();

    expect(Post::query()->exists())->toBeFalse();
});

test('the community page is for moderators', function () {
    communityPost(communityMember());

    $this->actingAs(communityModerator())
        ->get(route('community'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('community/index')
            ->has('posts.data', 1)
            ->where('posts.data.0.can_delete', true));

    $this->actingAs(communityMember())->get(route('community'))->assertForbidden();
});

test('accounts awaiting approval cannot post', function () {
    $pending = User::factory()->pending()->create();

    $this->actingAs($pending)
        ->post(route('posts.store'), ['body' => 'Hello'])
        ->assertRedirect(route('login'));

    expect(Post::query()->exists())->toBeFalse();
});
