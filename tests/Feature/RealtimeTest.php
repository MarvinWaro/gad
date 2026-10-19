<?php

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\NotificationKind;
use App\Events\LiveSignal;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Post;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\LiveUpdates;
use App\Support\ActivityPlace;
use App\Support\LiveChannels;
use Database\Seeders\RbacSeeder;
use Illuminate\Events\Dispatcher;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei();
    $this->region = $this->hei->cluster->survey_region_id;
    $this->otherRegion = SurveyRegion::query()->create(['name' => 'Fictional Region', 'is_active' => true])->id;
    Event::fake([LiveSignal::class]);
});

/** Every channel signalled with `$name` so far. */
function signalled(string $name = LiveSignal::CHANGED): array
{
    return Event::dispatched(LiveSignal::class, fn (LiveSignal $signal): bool => $signal->name === $name)
        ->flatMap(fn (array $dispatch): array => $dispatch[0]->channels)
        ->all();
}

test('a comment tells the community, its post\'s page and the author\'s bell, after the response', function () {
    $author = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $author->assignRole('hei');
    $commenter = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $commenter->assignRole('hei');
    $post = Post::query()->create(['user_id' => $author->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Our GAD orientation']);

    $this->withoutDefer()->actingAs($commenter)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Congratulations!'])
        ->assertSuccessful();

    expect(signalled())->toContain('live.community', "record.post.{$post->id}", 'live.activity-logs', "live.activity-logs.region.{$this->region}")
        ->and(signalled(LiveSignal::INBOX))->toBe(["App.Models.User.{$author->id}"]);
    // The feeds are told which post, and nothing more.
    Event::assertDispatched(LiveSignal::class, fn (LiveSignal $signal): bool => $signal->name === LiveSignal::POSTS
        && $signal->channels === ['live.community']
        && $signal->broadcastWith() === ['ids' => [$post->id]]);
});

test('a feed gets the posts it shows fresh, as its reader sees them, without those deleted', function () {
    $author = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $author->assignRole('hei');
    $reader = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $reader->assignRole('hei');
    $kept = Post::query()->create(['user_id' => $author->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Our GAD orientation']);
    $kept->comments()->create(['user_id' => $reader->id, 'body' => 'Congratulations!']);
    $deleted = Post::query()->create(['user_id' => $author->id, 'survey_hei_id' => $this->hei->id, 'body' => 'A removed post']);
    $deletedId = $deleted->id;
    $deleted->delete();

    $this->actingAs($reader)
        ->getJson(route('posts.live', ['ids' => [strtoupper($kept->id), $deletedId]]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $kept->id)
        ->assertJsonPath('data.0.comments_count', 1)
        ->assertJsonPath('data.0.comments.0.body', 'Congratulations!')
        ->assertJsonPath('data.0.can_edit', false);

    $this->getJson(route('posts.live', ['ids' => ['not-a-post']]))->assertJsonValidationErrors('ids.0');
    $this->getJson(route('posts.live', ['ids' => array_fill(0, 21, $kept->id)]))->assertJsonValidationErrors('ids');
    $this->getJson(route('posts.live'))->assertJsonValidationErrors('ids');
});

test('signed-out visitors get no posts', function () {
    $this->getJson(route('posts.live', ['ids' => ['01J00000000000000000000000']]))->assertUnauthorized();
});

test('a share tells the feeds about the post shared, whose count went up', function () {
    $author = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $author->assignRole('hei');
    $original = Post::query()->create(['user_id' => $author->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Our GAD orientation']);
    $live = app(LiveUpdates::class);

    app(ActivityRecorder::class)->record(ActivityAction::Shared, ActivityModule::Community, $original, actor: $author);
    $live->flush();

    Event::assertDispatched(LiveSignal::class, fn (LiveSignal $signal): bool => $signal->name === LiveSignal::POSTS
        && $signal->broadcastWith() === ['ids' => [$original->id]]);
});

test('a change is told on its module\'s channels by where it happened, once per request', function () {
    $live = app(LiveUpdates::class);
    $recorder = app(ActivityRecorder::class);
    $place = new ActivityPlace($this->region, null, $this->hei->id);
    $recorder->record(ActivityAction::Submitted, ActivityModule::Monitoring, label: 'A report', place: $place);
    $recorder->record(ActivityAction::Submitted, ActivityModule::Monitoring, label: 'A report', place: $place);

    Event::assertNotDispatched(LiveSignal::class);
    $live->flush();

    Event::assertDispatchedTimes(LiveSignal::class, 1);
    expect(signalled())->toEqualCanonicalizing([
        'live.monitoring',
        "live.monitoring.region.{$this->region}",
        "live.monitoring.hei.{$this->hei->id}",
        'live.activity-logs',
        "live.activity-logs.region.{$this->region}",
        "live.activity-logs.hei.{$this->hei->id}",
    ]);
});

test('a sign-up reaches the users list; signing in only the activity log', function () {
    $recorder = app(ActivityRecorder::class);
    $place = new ActivityPlace($this->region);

    $recorder->record(ActivityAction::Login, ActivityModule::Authentication, actorName: 'someone@example.test', place: $place);
    app(LiveUpdates::class)->flush();
    expect(collect(signalled())->filter(fn (string $channel): bool => str_starts_with($channel, 'live.users')))->toBeEmpty();

    $recorder->record(ActivityAction::Registered, ActivityModule::Authentication, actorName: 'someone@example.test', place: $place);
    app(LiveUpdates::class)->flush();
    expect(signalled())->toContain('live.users', "live.users.region.{$this->region}");
});

test('a sign-up rings the bells of its region\'s approvers and its HEI\'s focal persons at once', function () {
    $focal = User::factory()->create(['survey_region_id' => $this->region]);
    $focal->assignRole('ched-focal');
    $heiFocal = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $heiFocal->assignRole('hei-focal');
    $elsewhere = User::factory()->create(['survey_region_id' => $this->otherRegion]);
    $elsewhere->assignRole('ched-focal');

    $this->withoutDefer()->post(route('register.store'), registrationPayload($this->hei, ['email' => 'pending@example.test']));

    expect(signalled(LiveSignal::INBOX))->toEqualCanonicalizing([
        "App.Models.User.{$focal->id}",
        "App.Models.User.{$heiFocal->id}",
    ]);
});

test('someone let straight in rings the same bells and joins their HEI\x27s people at once', function () {
    $focal = User::factory()->create(['survey_region_id' => $this->region]);
    $focal->assignRole('ched-focal');
    $heiFocal = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $heiFocal->assignRole('hei-focal');
    $this->hei->cluster->region->update(['instant_registration' => true]);

    $this->withoutDefer()->post(route('register.store'), registrationPayload($this->hei, ['email' => 'instant@example.test']));

    expect(signalled(LiveSignal::INBOX))->toEqualCanonicalizing([
        "App.Models.User.{$focal->id}",
        "App.Models.User.{$heiFocal->id}",
    ])
        ->and(signalled())->toContain("live.users.region.{$this->region}", "live.colleagues.hei.{$this->hei->id}");
});

test('a broken WebSocket server never fails the change', function () {
    Event::swap(new class(app()) extends Dispatcher
    {
        public function dispatch($event, $payload = [], $halt = false)
        {
            throw_if($event instanceof LiveSignal, new RuntimeException('Soketi is down'));

            return parent::dispatch($event, $payload, $halt);
        }
    });
    $live = app(LiveUpdates::class);
    $live->touched(ActivityModule::SiteRatings, null);

    expect(fn () => $live->flush())->not->toThrow(RuntimeException::class);
});

test('reading a notification tells the reader\'s other tabs and devices', function () {
    $author = User::factory()->create();
    $author->assignRole('hei');

    $entry = ActivityLog::query()->create(['actor_name' => 'System', 'module' => ActivityModule::Community, 'action' => ActivityAction::Commented]);
    Notification::query()->create(['user_id' => $author->id, 'kind' => NotificationKind::PostCommented, 'activity_log_id' => $entry->id, 'notified_at' => now()]);

    $this->withoutDefer()->actingAs($author)->postJson(route('notifications.read-all'))->assertOk();
    expect(signalled(LiveSignal::INBOX))->toBe(["App.Models.User.{$author->id}"]);

    // Nothing left to read: nothing to tell.
    $this->postJson(route('notifications.read-all'))->assertOk();
    Event::assertDispatchedTimes(LiveSignal::class, 1);
});

test('each person is offered only the channels of their place', function () {
    $admin = User::factory()->create(['national_access' => true]);
    $admin->assignRole('admin');
    $focal = User::factory()->create(['survey_region_id' => $this->region]);
    $focal->assignRole('ched-focal');
    $heiFocal = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $heiFocal->assignRole('hei-focal');

    expect(LiveChannels::follow($admin, 'users'))->toBe(['live.users'])
        ->and(LiveChannels::follow($focal, 'users'))->toBe(["live.users.region.{$this->region}", 'live.users.region.none'])
        ->and(LiveChannels::mayFollow($focal, 'users', "live.users.region.{$this->otherRegion}"))->toBeFalse()
        ->and(LiveChannels::mayFollow($focal, 'users', 'live.users'))->toBeFalse()
        ->and(LiveChannels::follow($heiFocal, 'users'))->toBe([])
        ->and(LiveChannels::follow($heiFocal, 'monitoring'))->toBe(["live.monitoring.hei.{$this->hei->id}"])
        ->and(LiveChannels::follow($heiFocal, 'events'))->toBe(["live.events.region.{$this->region}", 'live.events.region.none'])
        ->and(LiveChannels::follow($heiFocal, 'community'))->toBe(['live.community'])
        ->and(LiveChannels::follow($heiFocal, 'not-a-module'))->toBe([])
        // People at your institution: their own HEI's, for any of its accounts; no one else's.
        ->and(LiveChannels::follow($heiFocal, 'colleagues'))->toBe(["live.colleagues.hei.{$this->hei->id}"])
        ->and(LiveChannels::mayFollow($heiFocal, 'colleagues', 'live.colleagues.hei.999'))->toBeFalse()
        ->and(LiveChannels::follow($admin, 'colleagues'))->toBe([])
        ->and(LiveChannels::follow($focal, 'colleagues'))->toBe([]);

    $this->actingAs($heiFocal)->get(route('dashboard'))->assertInertia(fn (Assert $page) => $page->where('realtime', null));
});

test('signed-in pages learn where to listen, never the secret', function () {
    config([
        'broadcasting.default' => 'pusher',
        'broadcasting.connections.pusher.secret' => 'fictional-secret',
        'broadcasting.connections.pusher.client' => ['key' => 'fictional-key', 'host' => 'ws.example.test', 'port' => 443, 'scheme' => 'https', 'cluster' => 'mt1'],
    ]);
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');

    $response = $this->actingAs($member)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('realtime.key', 'fictional-key')
            ->where('realtime.host', 'ws.example.test')
            ->where('realtime.user', "App.Models.User.{$member->id}")
            ->where('realtime.modules.events', ["live.events.region.{$this->region}", 'live.events.region.none'])
            ->missing('realtime.modules.users'));

    expect($response->getContent())->not->toContain('fictional-secret');
});

test('only the person themselves may listen to their own channel', function () {
    config([
        'broadcasting.default' => 'pusher',
        'broadcasting.connections.pusher.key' => 'fictional-key',
        'broadcasting.connections.pusher.secret' => 'fictional-secret',
        'broadcasting.connections.pusher.app_id' => 'phlgadis',
    ]);
    // Channels are kept by the broadcaster they were registered on.
    require base_path('routes/channels.php');
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');
    $other = User::factory()->create();
    $auth = fn (string $channel) => $this->postJson('/broadcasting/auth', ['socket_id' => '1234.5678', 'channel_name' => $channel]);

    $this->actingAs($member);
    $auth("private-App.Models.User.{$member->id}")->assertOk()->assertJsonStructure(['auth']);
    $auth("private-App.Models.User.{$other->id}")->assertForbidden();
    $auth('private-live.users')->assertForbidden();
    $auth("private-live.events.region.{$this->region}")->assertOk();
    $auth("private-live.events.region.{$this->otherRegion}")->assertForbidden();

    Broadcast::forgetDrivers();
});
