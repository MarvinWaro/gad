<?php

use App\Enums\UserStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Badge;
use App\Models\CarouselSlide;
use App\Models\Role;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->nationalOffice()->create();
    $this->admin->assignRole('admin');
});

/** An active HEI User at a fresh institution. */
function listStateMember(string $name = 'Ana Cruz', UserStatus $status = UserStatus::Active): User
{
    $user = User::factory()->create(['name' => $name, 'status' => $status, 'survey_hei_id' => createSurveyHei(['name' => "{$name} College"])->id]);
    $user->assignRole('hei');

    return $user;
}

test('promoting a user from a filtered list returns to that same filtered list', function () {
    $member = listStateMember();
    $focal = Role::query()->where('slug', 'hei-focal')->sole();
    $filtered = route('settings.users.index').'?role=hei&status=active&search=Ana&page=1';

    $this->actingAs($this->admin)->from($filtered)
        ->put(route('settings.users.update', $member), [
            'name' => $member->name,
            'email' => $member->email,
            'password' => '',
            'password_confirmation' => '',
            'survey_hei_id' => $member->survey_hei_id,
            'role_ids' => [$focal->id],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect($filtered);

    expect($member->fresh()->hasRole('hei-focal'))->toBeTrue();
});

test('adding and deleting users keep the list as it was', function () {
    $hei = Role::query()->where('slug', 'hei')->sole();
    $filtered = route('settings.users.index').'?role=hei&page=2';

    $this->actingAs($this->admin)->from($filtered)
        ->post(route('settings.users.store'), [
            'name' => 'New Member',
            'email' => 'new-member@example.test',
            'survey_hei_id' => createSurveyHei()->id,
            'role_ids' => [$hei->id],
        ])
        ->assertRedirect($filtered);

    $this->actingAs($this->admin)->from($filtered)
        ->delete(route('settings.users.destroy', User::query()->where('email', 'new-member@example.test')->sole()))
        ->assertRedirect($filtered);
});

test('only the list itself is returned to, on this site, with its query', function (string $referer, string $expected) {
    $member = listStateMember();

    $this->actingAs($this->admin)->from($referer)
        ->delete(route('settings.users.destroy', $member))
        ->assertRedirect(str_replace('{list}', route('settings.users.index'), $expected));
})->with([
    'another host keeps the query, on this host' => ['https://elsewhere.example/settings/users?role=hei', '{list}?role=hei'],
    'a trailing slash is the same list' => ['http://localhost/settings/users/?role=hei', '{list}?role=hei'],
    'another page lands on the list itself' => ['http://localhost/settings/roles?search=focal', '{list}'],
    'an empty query adds nothing' => ['http://localhost/settings/users?', '{list}'],
]);

test('roles, slides, events and badges keep their lists as they were', function () {
    Storage::fake('public');
    $role = Role::query()->create(['name' => 'Temporary Role', 'slug' => 'temporary-role']);
    $slide = CarouselSlide::factory()->create();
    $badge = Badge::query()->create(['name' => 'Forum Speaker', 'description' => 'Spoke at the forum.', 'is_active' => true]);

    $roles = route('settings.roles.index').'?search=temp&page=1';
    $this->actingAs($this->admin)->from($roles)->delete(route('settings.roles.destroy', $role))->assertRedirect($roles);

    $slides = route('admin.carousels.index').'?search=slide';
    $this->actingAs($this->admin)->from($slides)->delete(route('admin.carousels.destroy', $slide))->assertRedirect($slides);

    $events = route('admin.events.index').'?search=training&page=1';
    $this->actingAs($this->admin)->from($events)
        ->post(route('admin.events.store'), [
            'title' => 'Regional GAD Training',
            'category' => 'training',
            'is_all_day' => false,
            'starts_at' => '2026-11-02T09:00',
            'ends_at' => '2026-11-02T16:00',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect($events);

    $badges = route('settings.badges.index').'?search=forum';
    $this->actingAs($this->admin)->from($badges)
        ->patch(route('settings.badges.status', $badge), ['is_active' => false])
        ->assertRedirect($badges);
    $this->actingAs($this->admin)->from($badges)->delete(route('settings.badges.destroy', $badge))->assertRedirect($badges);
});

test('deleting a survey response keeps its list, or leaves its own page for the list', function () {
    $this->seed(SurveySeeder::class);
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $response = fn (): SurveyResponse => SurveyResponse::query()->forceCreate([
        'survey_version_id' => $survey->draftVersion()->id,
        'public_reference' => 'RA7877-'.Str::upper(Str::random(10)),
        'answers' => [],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
    ]);
    $list = route('admin.surveys.responses.index', $survey);

    $first = $response();
    $this->actingAs($this->admin)->from($list.'?search=RA7877&sex=female')
        ->delete(route('admin.surveys.responses.destroy', [$survey, $first]))
        ->assertRedirect($list.'?search=RA7877&sex=female')
        ->assertInertiaFlash('toast.message', "Response {$first->public_reference} deleted.");

    $second = $response();
    $this->actingAs($this->admin)->from(route('admin.surveys.responses.show', [$survey, $second]))
        ->delete(route('admin.surveys.responses.destroy', [$survey, $second]))
        ->assertRedirect($list);
});

test('deleting a draft survey keeps the library filters', function () {
    $this->seed(SurveySeeder::class);
    $draft = Survey::query()->where('slug', 'ra-11313')->sole();
    $library = route('admin.surveys.index').'?academic_year=2025-2026&page=1';

    $this->actingAs($this->admin)->from($library)
        ->delete(route('admin.surveys.destroy', $draft))
        ->assertRedirect($library);
});

test('a page a change emptied opens the list\'s new last page, keeping its filters', function () {
    foreach (range(1, 11) as $index) {
        listStateMember("Member {$index}");
    }

    // Eleven HEI Users fill a page of ten and one more; page 3 is gone.
    $this->actingAs($this->admin)
        ->get(route('settings.users.index', ['role' => 'hei', 'page' => 3]))
        ->assertRedirect(route('settings.users.index', ['role' => 'hei', 'page' => 2]));

    // When only one page is left, it needs no number.
    $this->actingAs($this->admin)
        ->get(route('settings.users.index', ['role' => 'hei-focal', 'page' => 2]))
        ->assertRedirect(route('settings.users.index', ['role' => 'hei-focal']));

    // Pages that exist and an empty first page stay put.
    foreach ([['role' => 'hei', 'page' => 2], ['role' => 'hei-focal']] as $query) {
        $this->actingAs($this->admin)->get(route('settings.users.index', $query))->assertOk();
    }
    // So do odd page numbers, on a list that doesn't validate them: the
    // paginator reads them as the first page.
    foreach ([0, 'abc'] as $page) {
        $this->actingAs($this->admin)->get(route('settings.roles.index', ['page' => $page]))->assertOk();
    }
});

test('approving the last pending user on a page lands on the page before, with its toast', function () {
    foreach (range(1, 11) as $index) {
        listStateMember("Pending {$index}", UserStatus::Pending);
    }
    // Pending registrations are listed by name: the last one sits alone on page 2.
    $last = User::query()->where('status', UserStatus::Pending)->orderBy('name')->get()->last();

    $this->actingAs($this->admin)
        ->from(route('settings.users.index', ['status' => 'pending', 'page' => 2]))
        ->followingRedirects()
        ->patch(route('settings.users.status', $last), ['status' => 'active'])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->url('/settings/users?status=pending')
            ->where('users.current_page', 1)
            ->hasFlash('toast.type', 'success'));
});

test('a refused change on a page that no longer exists still shows why', function () {
    $this->seed(SurveySeeder::class);
    $published = Survey::query()->where('slug', 'ra-7877')->sole();
    $published->draftVersion()->update(['status' => 'published', 'published_at' => now()]);

    $this->actingAs($this->admin)
        ->from(route('admin.surveys.index', ['page' => 9]))
        ->followingRedirects()
        ->delete(route('admin.surveys.destroy', $published))
        ->assertInertia(fn (Assert $page) => $page
            ->url('/admin/surveys')
            ->where('errors.survey', 'Published surveys must be archived and cannot be deleted.'));
});

test('the survey library\'s own page reload past its end is sent to its last page', function () {
    $this->seed(SurveySeeder::class);

    $this->actingAs($this->admin)
        ->get(route('admin.surveys.index', ['page' => 9]), [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
            'X-Inertia-Partial-Component' => 'admin/surveys/index',
            'X-Inertia-Partial-Data' => 'surveys',
        ])
        ->assertRedirect(route('admin.surveys.index'));
});
