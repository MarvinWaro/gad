<?php

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\NotificationKind;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Follow HEI']);
    $this->ana = followMember('Ana Dela Cruz');
    $this->ben = followMember('Ben Santos');
});

function followMember(string $name, string $role = 'hei'): User
{
    $user = User::factory()->create(['name' => $name, 'survey_hei_id' => test()->hei->id]);
    $user->assignRole($role);

    return $user;
}

test('following someone tells them once, and taking it back takes the notice away', function () {
    $this->actingAs($this->ben)->postJson(route('people.follow', $this->ana))
        ->assertOk()
        ->assertExactJson(['following' => true, 'followers_count' => 1]);
    // Following twice changes nothing.
    $this->postJson(route('people.follow', $this->ana))
        ->assertExactJson(['following' => true, 'followers_count' => 1]);

    $notice = Notification::query()->where('user_id', $this->ana->id)->sole();
    expect($notice->kind)->toBe(NotificationKind::UserFollowed)
        ->and($notice->linkFor($this->ana))->toBe(route('people.show', $this->ben));
    expect(ActivityLog::query()->where('module', ActivityModule::People)->sole())
        ->action->toBe(ActivityAction::Followed)
        ->user_id->toBe($this->ben->id)
        ->subject_id->toBe((string) $this->ana->id);

    $this->actingAs($this->ana)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.actor.name', 'Ben Santos')
        ->assertJsonPath('data.0.sentence.before', 'started following you')
        ->assertJsonPath('data.0.url', route('people.show', $this->ben));

    $this->actingAs($this->ben)->deleteJson(route('people.unfollow', $this->ana))
        ->assertExactJson(['following' => false, 'followers_count' => 0]);
    $this->deleteJson(route('people.unfollow', $this->ana))->assertOk();

    expect(Notification::query()->where('user_id', $this->ana->id)->count())->toBe(0)
        ->and(ActivityLog::query()->where('action', ActivityAction::Unfollowed)->count())->toBe(1);
});

test('nobody follows themselves, or accounts that cannot sign in', function () {
    $pending = User::factory()->pending()->create();
    $inactive = User::factory()->inactive()->create();

    $this->actingAs($this->ben)->postJson(route('people.follow', $this->ben))->assertForbidden();
    $this->postJson(route('people.follow', $pending))->assertForbidden();
    $this->postJson(route('people.follow', $inactive))->assertForbidden();

    // Stopping is always allowed.
    $this->deleteJson(route('people.unfollow', $inactive))->assertExactJson(['following' => false, 'followers_count' => 0]);
    expect(DB::table('follows')->count())->toBe(0);
});

test('a profile counts and lists active followers only, the latest first', function () {
    $carl = followMember('Carl Lim');
    $gone = followMember('Gone Member');
    $this->actingAs($this->ben)->postJson(route('people.follow', $this->ana));
    $this->travel(1)->minutes();
    $this->actingAs($carl)->postJson(route('people.follow', $this->ana));
    $this->actingAs($gone)->postJson(route('people.follow', $this->ana));
    $gone->update(['status' => 'inactive']);
    $this->actingAs($this->ana)->postJson(route('people.follow', $carl));

    $this->actingAs($this->ben)->get(route('people.show', $this->ana))
        ->assertInertia(fn (Assert $page) => $page
            ->where('person.followers_count', 2)
            ->where('person.following_count', 1)
            ->where('person.following', true)
            ->where('person.follows_you', false));

    $this->getJson(route('people.followers', $this->ana))
        ->assertOk()
        ->assertJsonPath('data.*.name', ['Carl Lim', 'Ben Santos'])
        ->assertJsonPath('data.1.is_you', true)
        ->assertJsonMissingPath('data.0.email');
    $this->getJson(route('people.following', $this->ana))
        ->assertJsonPath('data.0.name', 'Carl Lim')
        ->assertJsonPath('data.0.affiliation', 'Fictional Follow HEI');
});

test('the Following feed shows only the people followed, and counts only their new posts', function () {
    $carl = followMember('Carl Lim');
    $at = CarbonImmutable::parse('2026-10-01 08:00', 'UTC');
    foreach ([$this->ana, $carl] as $index => $author) {
        Post::query()->forceCreate([
            'user_id' => $author->id,
            'survey_hei_id' => $this->hei->id,
            'body' => "Post by {$author->name}",
            'created_at' => $at->addMinutes($index),
            'updated_at' => $at->addMinutes($index),
        ]);
    }
    $this->actingAs($this->ben)->postJson(route('people.follow', $this->ana));

    $this->get(route('dashboard', ['feed' => 'following']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('hei/home')
            ->where('feed', 'following')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('posts.data', 1)
                ->where('posts.data.0.author.name', 'Ana Dela Cruz')));
    $this->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('feed', 'all')
            ->loadDeferredProps(fn (Assert $reload) => $reload->has('posts.data', 2)));

    $newest = ['after' => strtolower((string) Str::ulid()), 'at' => $at->subDay()->toIso8601String()];
    $this->getJson(route('posts.newer', $newest))->assertJsonPath('count', 2);
    $this->getJson(route('posts.newer', [...$newest, 'feed' => 'following']))->assertJsonPath('count', 1);

    $this->get(route('dashboard', ['feed' => 'everyone']))->assertSessionHasErrors('feed');
});

test('CHED staff have the Following feed in Gender Mainstreaming too', function () {
    $staff = User::factory()->regionalOffice($this->hei->cluster->region)->create();
    $staff->assignRole('ched-focal');
    Post::query()->create(['user_id' => $this->ana->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Followed']);
    Post::query()->create(['user_id' => $this->ben->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Not followed']);
    $this->actingAs($staff)->postJson(route('people.follow', $this->ana));

    $this->get(route('community', ['feed' => 'following']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('feed', 'following')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('posts.data', 1)
                ->where('posts.data.0.body', 'Followed')));
});
