<?php

use App\Models\ActivityLog;
use App\Models\Post;
use App\Models\User;
use App\Support\HomepageStories;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    // AY 2026-2027.
    $this->travelTo(CarbonImmutable::parse('2026-10-02 10:00:00', 'Asia/Manila'));
    $this->hei = createSurveyHei(['name' => 'NOTRE DAME OF MARBEL UNIVERSITY']);
    $this->member = User::factory()->create(['name' => 'Maria Santos', 'survey_hei_id' => $this->hei->id]);
    $this->member->assignRole('hei');
});

/** @param  array<string, mixed>  $attributes */
function storyPost(User $author, int $photos = 1, array $attributes = []): Post
{
    $post = Post::query()->forceCreate([
        'user_id' => $author->id,
        'survey_hei_id' => $author->survey_hei_id,
        'body' => 'Our campus GAD forum. It brought students and staff together.',
        'created_at' => now()->subDays(3),
        'updated_at' => now()->subDays(3),
        ...$attributes,
    ]);
    for ($index = 1; $index <= $photos; $index++) {
        $post->images()->create(['path' => "posts/photo-{$index}.jpg", 'width' => 1200, 'height' => 800, 'sort_order' => $index]);
    }

    return $post;
}

function storyReactions(Post $post, int $count): void
{
    foreach (range(1, $count) as $index) {
        $post->reactions()->create(['user_id' => User::factory()->create()->id, 'type' => 'heart']);
    }
}

test('the homepage shows the year\'s most reacted photo posts, at most three', function () {
    $quiet = storyPost($this->member, attributes: ['body' => 'Quiet post.']);
    $loved = storyPost($this->member, attributes: ['body' => 'Loved post.']);
    $liked = storyPost($this->member, attributes: ['body' => 'Liked post.']);
    $talked = storyPost($this->member, attributes: ['body' => 'Talked about post.']);
    storyReactions($loved, 5);
    storyReactions($liked, 2);
    storyReactions($talked, 2);
    $talked->comments()->create(['user_id' => $this->member->id, 'body' => 'Great work!']);

    $stories = HomepageStories::top();

    expect(array_column($stories, 'title'))->toBe(['Loved post.', 'Talked about post.', 'Liked post.'])
        ->and(array_column($stories, 'reactions'))->toBe([5, 2, 2])
        ->and(array_column($stories, 'id'))->not->toContain($quiet->id);
});

test('only original photo posts from this academic year qualify', function () {
    storyPost($this->member, photos: 0, attributes: ['body' => 'Text only.']);
    $original = storyPost($this->member, attributes: ['body' => 'With a photo.']);
    storyPost($this->member, attributes: ['body' => 'A share.', 'shared_post_id' => $original->id]);
    storyPost($this->member, attributes: ['body' => 'Last year.', 'created_at' => CarbonImmutable::parse('2026-07-31 12:00:00', 'Asia/Manila')]);
    storyPost($this->member, attributes: ['body' => 'Hidden.', 'homepage_hidden_at' => now()]);

    expect(array_column(HomepageStories::top(), 'title'))->toBe(['With a photo.']);
});

test('a story names the institution, never the person', function () {
    storyPost($this->member, photos: 6, attributes: ['body' => "A day of GAD learning on campus for all students and staff of the university\nMore lines follow."]);

    $story = HomepageStories::top()[0];

    expect($story['source'])->toBe('Notre Dame of Marbel University')
        ->and($story['title'])->toBe('A day of GAD learning on campus for all students and staff of the university')
        ->and($story['images'])->toHaveCount(6)
        ->and($story['images'][0])->toHaveKeys(['id', 'url', 'width', 'height'])
        ->and(json_encode($story))->not->toContain('Maria Santos')
        ->and(array_keys($story))->not->toContain('author');
});

test('a CHED post is credited to its office', function () {
    $staff = User::factory()->regionalOffice($this->hei->cluster->region)->create();
    $staff->assignRole('admin');
    storyPost($staff, attributes: ['body' => '']);

    $story = HomepageStories::top()[0];

    expect($story['source'])->toBe('CHED Regional Office XII')
        ->and($story['title'])->toBe('A GAD activity from CHED Regional Office XII');
});

test('the public homepage carries the stories, also to guests', function () {
    storyPost($this->member);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('stories', 1)
            ->where('stories.0.source', 'Notre Dame of Marbel University'));
});

test('a moderator hides a post from the homepage at once, and can show it again', function () {
    $post = storyPost($this->member);
    expect(HomepageStories::top())->toHaveCount(1);
    $moderator = User::factory()->nationalOffice()->create();
    $moderator->assignRole('admin');

    $this->actingAs($moderator)
        ->put(route('posts.homepage.update', $post), ['hidden' => true])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($post->fresh()->homepage_hidden_at)->not->toBeNull()
        ->and(HomepageStories::top())->toBe([])
        ->and(ActivityLog::query()->latest()->first()->properties)->toMatchArray(['homepage' => 'hidden']);

    $this->actingAs($moderator)->put(route('posts.homepage.update', $post), ['hidden' => false]);

    expect(HomepageStories::top())->toHaveCount(1);
});

test('only moderators may hide posts, and only originals with photos', function () {
    $post = storyPost($this->member);
    $textOnly = storyPost($this->member, photos: 0);
    $moderator = User::factory()->nationalOffice()->create();
    $moderator->assignRole('admin');

    $this->actingAs($this->member)
        ->put(route('posts.homepage.update', $post), ['hidden' => true])
        ->assertForbidden();
    $this->actingAs($moderator)
        ->put(route('posts.homepage.update', $textOnly), ['hidden' => true])
        ->assertForbidden();

    expect($post->fresh()->homepage_hidden_at)->toBeNull();
});

test('deleting a post takes it off the homepage straight away', function () {
    $post = storyPost($this->member);
    expect(HomepageStories::top())->toHaveCount(1);

    $post->delete();

    expect(HomepageStories::top())->toBe([]);
});

test('the feed offers the homepage control to moderators only', function () {
    $post = storyPost($this->member);
    $moderator = User::factory()->nationalOffice()->create();
    $moderator->assignRole('admin');

    $this->actingAs($moderator)->get(route('posts.show', $post))
        ->assertInertia(fn (Assert $page) => $page
            ->where('post.can_hide_from_homepage', true)
            ->where('post.homepage_hidden', false));
    $this->actingAs($this->member)->get(route('posts.show', $post))
        ->assertInertia(fn (Assert $page) => $page->where('post.can_hide_from_homepage', false));
});
