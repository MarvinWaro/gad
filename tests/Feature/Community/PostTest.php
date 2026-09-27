<?php

use App\Enums\PostFeeling;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\User;
use App\Support\InstitutionName;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
    'too many photos' => [['images' => array_map(fn () => UploadedFile::fake()->image('p.jpg'), range(1, Post::MAX_IMAGES + 1))], 'images'],
    'not a photo' => [['images' => [UploadedFile::fake()->create('report.pdf', 10, 'application/pdf')]], 'images.0'],
]);

test('a post holds up to ten photos, kept in order', function () {
    $this->actingAs(communityMember())
        ->post(route('posts.store'), [
            'images' => array_map(fn (int $n) => UploadedFile::fake()->image("p{$n}.jpg"), range(1, Post::MAX_IMAGES)),
        ])
        ->assertSessionHasNoErrors();

    $post = Post::query()->with('images')->sole();

    expect($post->images)->toHaveCount(10)
        ->and($post->images->pluck('sort_order')->all())->toBe(range(0, 9));
});

test('authors add a feeling and tag active people, and the feed shows both', function () {
    $author = communityMember();
    $colleague = communityMember();
    $colleague->update(['name' => 'Ana Cruz']);
    $staff = communityModerator();
    $staff->update(['name' => 'Ben Reyes']);

    $this->actingAs($author)
        ->post(route('posts.store'), [
            'body' => 'Gender sensitivity training with our partners.',
            'feeling' => 'proud',
            'tags' => [$staff->id, $colleague->id],
        ])
        ->assertSessionHasNoErrors();

    $post = Post::query()->with('tags')->sole();

    expect($post->feeling)->toBe(PostFeeling::Proud)
        ->and($post->tags->pluck('id')->all())->toBe([$colleague->id, $staff->id]);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.data.0.feeling', ['value' => 'proud', 'label' => 'proud', 'emoji' => '🏅'])
            ->has('posts.data.0.tags', 2)
            ->where('posts.data.0.tags.0.name', 'Ana Cruz')
            ->where('posts.data.0.tags.0.hei', InstitutionName::display($colleague->hei->name))
            ->where('posts.data.0.tags.1.name', 'Ben Reyes')
            ->where('posts.data.0.tags.1.hei', null));
});

test('a post without a feeling or tags shows neither', function () {
    $author = communityMember();
    communityPost($author);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.data.0.feeling', null)
            ->has('posts.data.0.tags', 0));
});

test('feelings and tags are validated', function () {
    $author = communityMember();
    $active = communityMember();
    $pending = User::factory()->pending()->create();
    $inactive = User::factory()->inactive()->create();

    $cases = [
        [['feeling' => 'angry'], 'feeling'],
        [['tags' => [$pending->id]], 'tags.0'],
        [['tags' => [$inactive->id]], 'tags.0'],
        [['tags' => [$author->id]], 'tags.0'],
        [['tags' => [$active->id, $active->id]], 'tags.0'],
        [['tags' => [999999]], 'tags.0'],
    ];

    foreach ($cases as [$payload, $field]) {
        $this->actingAs($author)
            ->post(route('posts.store'), ['body' => 'Activity report', ...$payload])
            ->assertSessionHasErrors($field);
    }

    expect(Post::query()->count())->toBe(0);
});

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

test('members share a post to the feed with an optional message', function () {
    $author = communityMember();
    $original = communityPost($author, ['feeling' => 'proud']);
    $sharer = communityMember();

    $this->actingAs($sharer)
        ->post(route('posts.share', $original), ['body' => 'Worth a read, fellow focal persons.'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $share = Post::query()->whereKeyNot($original->id)->sole();

    expect($share->user_id)->toBe($sharer->id)
        ->and($share->survey_hei_id)->toBe($sharer->survey_hei_id)
        ->and($share->shared_post_id)->toBe($original->id)
        ->and($share->body)->toBe('Worth a read, fellow focal persons.');

    $this->actingAs($sharer)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.data.0.id', $share->id)
            ->where('posts.data.0.shared_post.id', $original->id)
            ->where('posts.data.0.shared_post.author.name', $author->name)
            ->where('posts.data.0.shared_post.feeling.value', 'proud')
            ->where('posts.data.1.id', $original->id)
            ->where('posts.data.1.shares_count', 1)
            ->where('posts.data.1.shared_post', null));
});

test('a share can have no message of its own, and keeps it empty when edited', function () {
    $original = communityPost(communityMember());
    $sharer = communityMember();

    $this->actingAs($sharer)->post(route('posts.share', $original))->assertSessionHasNoErrors();
    $share = Post::query()->where('shared_post_id', $original->id)->sole();

    expect($share->body)->toBeNull();

    $this->actingAs($sharer)
        ->put(route('posts.update', $share), ['body' => ''])
        ->assertSessionHasNoErrors();
});

test('sharing a share passes along the original', function () {
    $original = communityPost(communityMember());
    $first = communityMember();
    $this->actingAs($first)->post(route('posts.share', $original));
    $share = Post::query()->where('user_id', $first->id)->sole();

    $second = communityMember();
    $this->actingAs($second)->post(route('posts.share', $share))->assertSessionHasNoErrors();

    expect(Post::query()->where('user_id', $second->id)->sole()->shared_post_id)->toBe($original->id);
});

test('removing a post removes its shares', function () {
    $author = communityMember();
    $original = communityPost($author);
    $this->actingAs(communityMember())->post(route('posts.share', $original));

    $this->actingAs($author)->delete(route('posts.destroy', $original))->assertRedirect();

    expect(Post::query()->count())->toBe(0);
});

test('share messages are validated and guests cannot share', function () {
    $original = communityPost(communityMember());

    $this->actingAs(communityMember())
        ->post(route('posts.share', $original), ['body' => str_repeat('a', 5001)])
        ->assertSessionHasErrors('body');

    auth()->logout();
    $this->post(route('posts.share', $original))->assertRedirect(route('login'));

    expect(Post::query()->count())->toBe(1);
});

test('a post has its own page for members, linking back to their feed', function () {
    $post = communityPost(communityMember());

    $this->actingAs(communityMember())
        ->get(route('posts.show', $post))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('posts/show')
            ->where('post.id', $post->id)
            ->where('feedUrl', route('dashboard')));

    $this->actingAs(communityModerator())
        ->get(route('posts.show', $post))
        ->assertInertia(fn (Assert $page) => $page->where('feedUrl', route('community')));
});

test('post pages are for signed-in members only', function () {
    $post = communityPost(communityMember());

    $this->get(route('posts.show', $post))->assertRedirect(route('login'));
    $this->actingAs(communityMember())->get('/posts/999999')->assertNotFound();
    $this->actingAs(communityMember())->get('/posts/'.Str::ulid())->assertNotFound();
});

test('removing a post from its own page returns to the feed', function () {
    $author = communityMember();
    $post = communityPost($author);

    $this->actingAs($author)
        ->from(route('posts.show', $post))
        ->delete(route('posts.destroy', $post))
        ->assertRedirect(route('dashboard'));

    $other = communityPost($author);

    $this->actingAs($author)
        ->from(route('dashboard'))
        ->delete(route('posts.destroy', $other))
        ->assertRedirect(route('dashboard'));
});

test('replies thread one level deep and name whom they answer', function () {
    $author = communityMember();
    $post = communityPost($author);
    $ana = communityMember();
    $ben = communityMember();

    $top = $this->actingAs($ana)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Congratulations!'])
        ->assertCreated()
        ->assertJsonPath('comment.parent_id', null)
        ->assertJsonPath('comment.reply_to', null)
        ->json('comment.id');

    $reply = $this->actingAs($ben)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Agreed.', 'parent_id' => $top])
        ->assertCreated()
        ->assertJsonPath('comment.parent_id', $top)
        ->assertJsonPath('comment.reply_to.id', $ana->id)
        ->json('comment.id');

    // A reply to a reply joins the same thread and names that reply's author.
    $this->actingAs($author)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Thank you both!', 'parent_id' => $reply])
        ->assertCreated()
        ->assertJsonPath('comment.parent_id', $top)
        ->assertJsonPath('comment.reply_to.id', $ben->id)
        ->assertJsonPath('comment.is_post_author', true)
        ->assertJsonPath('comments_count', 3);

    // Answering yourself names no one.
    $this->actingAs($ana)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Also, see you there.', 'parent_id' => $top])
        ->assertJsonPath('comment.reply_to', null);
});

test('the feed nests replies under their comment', function () {
    $author = communityMember();
    $post = communityPost($author);
    $ana = communityMember();
    $top = $post->comments()->create(['user_id' => $ana->id, 'body' => 'Great work!']);
    $post->comments()->create(['user_id' => $author->id, 'parent_id' => $top->id, 'reply_to_user_id' => $ana->id, 'body' => 'Thank you!']);

    $this->actingAs($ana)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('posts.data.0.comments', 1)
            ->where('posts.data.0.comments_count', 2)
            ->where('posts.data.0.has_more_comments', false)
            ->where('posts.data.0.comments.0.is_post_author', false)
            ->has('posts.data.0.comments.0.replies', 1)
            ->where('posts.data.0.comments.0.replies.0.body', 'Thank you!')
            ->where('posts.data.0.comments.0.replies.0.is_post_author', true)
            ->where('posts.data.0.comments.0.replies.0.reply_to.name', $ana->name));
});

test('replies must answer a comment on the same post', function () {
    $other = communityPost(communityMember());
    $elsewhere = $other->comments()->create(['user_id' => communityMember()->id, 'body' => 'Hello']);
    $post = communityPost(communityMember());

    $this->actingAs(communityMember())
        ->postJson(route('posts.comments.store', $post), ['body' => 'Hi', 'parent_id' => $elsewhere->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('parent_id');
});

test('removing a comment removes its replies', function () {
    $post = communityPost(communityMember());
    $commenter = communityMember();
    $top = $post->comments()->create(['user_id' => $commenter->id, 'body' => 'First']);
    $post->comments()->create(['user_id' => communityMember()->id, 'parent_id' => $top->id, 'body' => 'Reply']);

    $this->actingAs($commenter)
        ->deleteJson(route('comments.destroy', $top))
        ->assertOk()
        ->assertJsonPath('comments_count', 0);

    expect(PostComment::query()->count())->toBe(0);
});
