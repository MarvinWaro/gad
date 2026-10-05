<?php

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\ActivityLog;
use App\Models\MonitoringReport;
use App\Models\Role;
use App\Models\SurveyCluster;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\DeviceName;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Activity HEI']);
    $this->region = $this->hei->cluster->region;
    $this->admin = User::factory()->nationalOffice()->create(['name' => 'Central Admin']);
    $this->admin->assignRole('admin');
});

/** @return list<string> */
function loggedActions(): array
{
    return ActivityLog::query()->oldest('created_at')->oldest('id')->get()->map(fn (ActivityLog $log): string => $log->action->value)->all();
}

test('signing in and out is logged with the device and place, and a failed attempt keeps no password', function () {
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

    $this->withHeader('User-Agent', $agent)
        ->post(route('login.store'), ['email' => $member->email, 'password' => 'wrong-password']);
    $this->withHeader('User-Agent', $agent)
        ->post(route('login.store'), ['email' => $member->email, 'password' => 'password']);
    $this->post(route('logout'));

    expect(loggedActions())->toBe(['login_failed', 'login', 'logout']);

    $failed = ActivityLog::query()->where('action', 'login_failed')->sole();
    expect($failed->user_id)->toBeNull()
        ->and($failed->actor_name)->toBe($member->email)
        ->and($failed->properties)->toBe(['reason' => 'credentials'])
        ->and($failed->survey_hei_id)->toBe($this->hei->id)
        ->and(json_encode($failed->toArray()))->not->toContain('wrong-password');

    $login = ActivityLog::query()->where('action', 'login')->sole();
    expect($login->user_id)->toBe($member->id)
        ->and($login->module)->toBe(ActivityModule::Authentication)
        ->and($login->survey_region_id)->toBe($this->region->id)
        ->and(DeviceName::from($login->user_agent))->toBe('Chrome on Windows 10/11');
});

test('a pending or deactivated account trying to sign in is logged with the reason', function () {
    $pending = User::factory()->pending()->create();

    $this->post(route('login.store'), ['email' => $pending->email, 'password' => 'password']);

    expect(ActivityLog::query()->sole())
        ->action->toBe(ActivityAction::LoginFailed)
        ->properties->toBe(['reason' => 'pending']);
});

test('editing an account logs what changed, roles included, but never the password', function () {
    $user = User::factory()->create(['name' => 'Old Name', 'survey_hei_id' => $this->hei->id]);
    $user->assignRole('hei');

    $this->actingAs($this->admin)->put(route('settings.users.update', $user), [
        'name' => 'New Name',
        'email' => $user->email,
        'password' => 'a-new-password-123',
        'password_confirmation' => 'a-new-password-123',
        'role_ids' => [Role::query()->where('slug', 'hei')->value('id'), Role::query()->where('slug', 'hei-focal')->value('id')],
        'survey_hei_id' => $this->hei->id,
    ])->assertSessionHasNoErrors();

    $log = ActivityLog::query()->sole();
    expect($log->action)->toBe(ActivityAction::Updated)
        ->and($log->module)->toBe(ActivityModule::Users)
        ->and($log->user_id)->toBe($this->admin->id)
        ->and($log->subject_type)->toBe('user')
        ->and($log->subject_label)->toBe('New Name')
        ->and($log->changes['name'])->toBe(['Old Name', 'New Name'])
        ->and($log->changes['roles'])->toBe(['HEI User', 'HEI Focal, HEI User'])
        // Set for someone else, it is theirs to replace.
        ->and($log->changes['password'])->toBe([null, 'Changed, to replace at next sign-in'])
        ->and($log->changes)->not->toHaveKey('must_change_password')
        ->and(json_encode($log->changes))->not->toContain('a-new-password-123');
});

test('changing your own profile reads as your own account, and saving it unchanged logs nothing', function () {
    $fields = ['name' => 'Central Admin', 'email' => $this->admin->email, 'mobile_number' => '09171234567'];

    $this->actingAs($this->admin)->patch(route('profile.update'), $fields)->assertSessionHasNoErrors();
    // Each request loads the account afresh, as the app does.
    $this->actingAs($this->admin->fresh())->patch(route('profile.update'), $fields)->assertSessionHasNoErrors();

    $this->actingAs($this->admin)->get(route('settings.activity-logs.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('logs.data', 1)
            ->where('logs.data.0.module.code', 'account')
            ->where('logs.data.0.sentence', ['before' => 'Updated their own account', 'subject' => null, 'after' => ''])
            ->where('logs.data.0.changes.0', ['field' => 'Mobile number', 'before' => null, 'after' => '09171234567']));
});

test('approving and deactivating accounts are logged as such', function () {
    $user = User::factory()->pending()->create(['survey_hei_id' => $this->hei->id]);
    $user->assignRole('hei');

    $this->actingAs($this->admin)->patch(route('settings.users.status', $user), ['status' => 'active']);
    $this->actingAs($this->admin)->patch(route('settings.users.status', $user), ['status' => 'inactive']);

    expect(loggedActions())->toBe(['approved', 'deactivated']);
});

test('switching an HEI off is logged as deactivating it, and an edit that changes nothing is not logged', function () {
    $route = route('settings.survey-directories.update', ['type' => 'heis', 'id' => $this->hei->id]);
    $fields = ['name' => $this->hei->name, 'survey_region_id' => $this->hei->cluster->survey_region_id];

    $this->actingAs($this->admin)->put($route, [...$fields, 'is_active' => true])->assertSessionHasNoErrors();
    $this->actingAs($this->admin)->put($route, [...$fields, 'is_active' => false])->assertSessionHasNoErrors();

    expect(ActivityLog::query()->sole())
        ->action->toBe(ActivityAction::Deactivated)
        ->module->toBe(ActivityModule::Heis)
        ->changes->toBe(['is_active' => [true, false]])
        ->survey_hei_id->toBe($this->hei->id);
});

test('a monitoring autosave logs which fields were saved, never what was typed', function () {
    Storage::fake('monitoring');
    $this->travelTo('2026-09-29 02:00:00');
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei-focal');

    $this->actingAs($member)->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 1])->assertRedirect();
    $report = MonitoringReport::query()->sole();
    $this->actingAs($member)->patchJson('/monitoring/'.$report->id.'/draft', [
        'details' => ['president_name' => ['base' => '', 'value' => 'A Secret President']],
    ])->assertOk();

    expect(loggedActions())->toBe(['created', 'draft_saved']);
    $saved = ActivityLog::query()->where('action', 'draft_saved')->sole();
    expect($saved->properties['details'])->toBe(['president_name'])
        ->and($saved->survey_hei_id)->toBe($this->hei->id)
        ->and(json_encode($saved->toArray()))->not->toContain('A Secret President');
});

test('anonymous survey answers and homepage ratings are never logged', function () {
    $this->post(route('ratings.store'), ['rating' => 5]);

    expect(ActivityLog::query()->count())->toBe(0);
});

test('regional staff see their region only; the Central Office sees every region', function () {
    $other = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $otherHei = createSurveyHei([
        'name' => 'Elsewhere College',
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $other->id, 'name' => 'Davao', 'is_active' => true])->id,
    ]);
    $recorder = app(ActivityRecorder::class);
    $recorder->record(ActivityAction::Updated, ActivityModule::Heis, $this->hei, actor: $this->admin);
    $recorder->record(ActivityAction::Updated, ActivityModule::Heis, $otherHei, actor: $this->admin);

    $regional = User::factory()->regionalOffice($this->region)->create();
    $regional->assignRole('admin');

    $this->actingAs($regional)->get(route('settings.activity-logs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/activity-logs')
            ->has('logs.data', 1)
            ->where('logs.data.0.place.hei', 'Fictional Activity HEI'));

    $this->actingAs($this->admin)->get(route('settings.activity-logs.index'))
        ->assertInertia(fn (Assert $page) => $page->has('logs.data', 2)->where('logs.meta.total', 2));
});

test('the list filters by person, action, module and day, and sends no raw user agent', function () {
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $recorder = app(ActivityRecorder::class);
    $recorder->record(ActivityAction::Login, ActivityModule::Authentication, actor: $member);
    $recorder->record(ActivityAction::Created, ActivityModule::Users, $member, actor: $this->admin);
    ActivityLog::query()->where('action', 'login')->update(['created_at' => '2026-09-30 16:30:00']);

    $index = fn (array $query) => $this->actingAs($this->admin)->get(route('settings.activity-logs.index', $query));

    $index(['user' => $member->id])->assertInertia(fn (Assert $page) => $page
        ->has('logs.data', 1)
        ->where('logs.data.0.action.code', 'login')
        ->where('person.name', $member->name));
    $index(['module' => 'users'])->assertInertia(fn (Assert $page) => $page
        ->has('logs.data', 1)
        ->where('logs.data.0.sentence', ['before' => 'Created user', 'subject' => $member->name, 'after' => '']));
    // 16:30 UTC on Sep 30 is already Oct 1 in the Philippines.
    $index(['from' => '2026-10-01', 'to' => '2026-10-01', 'action' => 'login'])
        ->assertInertia(fn (Assert $page) => $page->has('logs.data', 1)->missing('logs.data.0.user_agent'));
    $index(['to' => '2026-09-30'])->assertInertia(fn (Assert $page) => $page->has('logs.data', 0));
});

test('HEI accounts cannot open the activity log', function () {
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei-focal');

    $this->actingAs($member)->get(route('settings.activity-logs.index'))->assertForbidden();
});
