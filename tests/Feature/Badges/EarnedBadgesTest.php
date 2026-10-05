<?php

use App\Actions\Badges\AwardEarnedBadges;
use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\BadgeRule;
use App\Models\ActivityLog;
use App\Models\Badge;
use App\Models\Post;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->member = User::factory()->create(['survey_hei_id' => createSurveyHei()->id]);
    $this->member->assignRole('hei');
});

/**
 * A post as the composer saves it: a photo or not, and the goals it says it
 * supports.
 *
 * @param  list<int>  $sdgs
 * @param  list<string>  $items
 */
function goalPost(User $author, array $sdgs = [5], array $items = [], bool $photo = true, ?CarbonImmutable $at = null, ?Post $shares = null): Post
{
    $post = Post::query()->forceCreate([
        'user_id' => $author->id,
        'survey_hei_id' => $author->survey_hei_id,
        'body' => 'An activity.',
        'shared_post_id' => $shares?->id,
        'created_at' => $at ?? now(),
        'updated_at' => $at ?? now(),
    ]);
    if ($photo) {
        $post->images()->create(['path' => 'posts/photo.jpg', 'width' => 800, 'height' => 600, 'sort_order' => 0]);
    }
    $post->sdgs()->createMany(array_map(fn (int $sdg): array => ['sdg' => $sdg], $sdgs));
    $post->achieveItems()->createMany(array_map(fn (string $item): array => ['item' => $item], $items));

    return $post;
}

/** @return list<string> */
function earnedNow(User $user): array
{
    return array_map(fn (Badge $badge): string => $badge->name, app(AwardEarnedBadges::class)->for($user));
}

test('one photo post tagged with a goal earns Community Spark, and only that', function () {
    goalPost($this->member, sdgs: [4, 5, 10], items: ['lifelong-learning']);

    expect(earnedNow($this->member))->toBe(['Community Spark'])
        ->and($this->member->badgeAwards()->count())->toBe(1);
    expect(ActivityLog::query()->where('module', ActivityModule::Badges)->sole())
        ->action->toBe(ActivityAction::Earned)
        ->user_id->toBe($this->member->id);
});

test('a photo without a goal, or a goal without a photo, earns nothing', function () {
    goalPost($this->member, sdgs: []);
    goalPost($this->member, sdgs: [5], photo: false);

    expect(earnedNow($this->member))->toBe([]);
});

test('Visual Storyteller needs tagged photo posts on five different days in Philippine time', function () {
    $day = CarbonImmutable::parse('2026-09-01 02:00', 'UTC');
    foreach (range(0, 4) as $hour) {
        goalPost($this->member, at: $day->addHours($hour));
    }
    expect(earnedNow($this->member))->toBe(['Community Spark']);

    // 23:00 UTC is already the next day in Manila.
    goalPost($this->member, at: $day->setTime(23, 0));
    foreach ([3, 4, 5] as $days) {
        goalPost($this->member, at: $day->addDays($days));
    }

    expect(BadgeRule::VisualStoryteller->isMetBy($this->member))->toBeTrue()
        ->and(earnedNow($this->member))->toBe(['Visual Storyteller']);
});

test('SDG Connector and Agenda Builder count different goals across own posts, never shares', function () {
    $original = goalPost(User::factory()->create(), sdgs: [1]);
    goalPost($this->member, sdgs: [1, 2, 3], items: ['lifelong-learning', 'human-capital'], photo: false);
    goalPost($this->member, sdgs: [3, 4], items: ['governance'], photo: false);
    goalPost($this->member, sdgs: [5], items: ['public-service'], photo: false, shares: $original);

    expect(earnedNow($this->member))->toBe([]);

    goalPost($this->member, sdgs: [5], items: ['public-service'], photo: false);

    expect(earnedNow($this->member))->toEqualCanonicalizing(['SDG Connector', 'Agenda Builder']);
});

test('a badge is earned once, stays when its post is deleted, and is not given while switched off', function () {
    $post = goalPost($this->member);
    expect(earnedNow($this->member))->toBe(['Community Spark'])
        ->and(earnedNow($this->member))->toBe([]);

    $post->delete();
    expect($this->member->badgeAwards()->count())->toBe(1);

    Badge::query()->where('rule', BadgeRule::SdgConnector)->update(['is_active' => false]);
    goalPost($this->member, sdgs: [1, 2, 3], photo: false);
    goalPost($this->member, sdgs: [4, 6], photo: false);

    expect(earnedNow($this->member))->toBe([]);
});

test('posting tells the member which badge they just earned', function () {
    Storage::fake('public');

    $this->actingAs($this->member)
        ->post(route('posts.store'), [
            'body' => 'Our Women\'s Month forum.',
            'images' => [UploadedFile::fake()->image('forum.jpg', 800, 600)],
            'sdgs' => [5],
        ])
        ->assertSessionHas('inertia.flash_data.toast.message', 'Post shared. You earned the Community Spark badge.');

    $this->actingAs($this->member)
        ->post(route('posts.store'), ['body' => 'Another day.'])
        ->assertSessionHas('inertia.flash_data.toast.message', 'Post shared.');
});

test('badges:award gives people who already posted the badges their posts earn', function () {
    goalPost($this->member);
    $other = User::factory()->create();
    goalPost($other, sdgs: [], photo: true);

    $this->artisan('badges:award')->expectsOutput('Gave 1 badges.')->assertSuccessful();

    expect($this->member->badgeAwards()->count())->toBe(1)
        ->and($other->badgeAwards()->count())->toBe(0);
});

test('a badge earned is told to its earner, from the system, and opens their Badges tab', function () {
    goalPost($this->member);
    earnedNow($this->member);

    $this->actingAs($this->member)->getJson(route('notifications.recent'))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.kind.code', 'badge_earned')
        ->assertJsonPath('data.0.actor', null)
        ->assertJsonPath('data.0.sentence.before', 'You earned the')
        ->assertJsonPath('data.0.sentence.subject', 'Community Spark')
        ->assertJsonPath('data.0.url', route('my-profile', ['tab' => 'badges']));

    // A deactivated account is told nothing.
    $other = User::factory()->inactive()->create();
    goalPost($other);
    earnedNow($other);
    expect($other->notifications()->count())->toBe(0);
});
