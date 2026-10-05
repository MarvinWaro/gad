<?php

use App\Enums\UserStatus;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->nationalOffice()->create();
    $this->admin->assignRole('admin');
});

test('administrators approve, deactivate, and reactivate accounts', function () {
    $user = User::factory()->pending()->create();
    $user->assignRole('hei');

    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $user), ['status' => 'active'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
    expect($user->fresh()->status)->toBe(UserStatus::Active);

    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $user), ['status' => 'inactive'])
        ->assertSessionHasNoErrors();
    expect($user->fresh()->status)->toBe(UserStatus::Inactive);

    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $user), ['status' => 'active'])
        ->assertSessionHasNoErrors();
    expect($user->fresh()->status)->toBe(UserStatus::Active);
});

test('an approved registration can log in', function () {
    $this->post(route('register.store'), registrationPayload(createSurveyHei()));
    $user = User::query()->where('email', 'test@example.com')->sole();

    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $user), ['status' => 'active']);
    auth()->logout();

    $this->post(route('login.store'), [
        'email' => 'test@example.com',
        'password' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticatedAs($user);
});

test('administrators cannot change their own status', function () {
    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $this->admin), ['status' => 'inactive'])
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');

    expect($this->admin->fresh()->status)->toBe(UserStatus::Active);
});

test('the last active administrator cannot be deactivated', function () {
    // Every permission, but not the admin role itself.
    $operatorRole = Role::query()->create(['name' => 'Operator', 'slug' => 'operator']);
    $operatorRole->permissions()->sync(Permission::query()->pluck('id'));
    $operator = User::factory()->nationalOffice()->create();
    $operator->assignRole($operatorRole);

    $this->actingAs($operator)
        ->patch(route('settings.users.status', $this->admin), ['status' => 'inactive'])
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');
    expect($this->admin->fresh()->status)->toBe(UserStatus::Active);

    $secondAdmin = User::factory()->create();
    $secondAdmin->assignRole('admin');

    $this->actingAs($operator)
        ->patch(route('settings.users.status', $this->admin), ['status' => 'inactive'])
        ->assertSessionHasNoErrors();
    expect($this->admin->fresh()->status)->toBe(UserStatus::Inactive);
});

test('status changes require permission to update users', function () {
    $focal = User::factory()->create();
    $focal->assignRole('gad-focal-person');
    $user = User::factory()->pending()->create();

    $this->actingAs($focal)
        ->patch(route('settings.users.status', $user), ['status' => 'active'])
        ->assertForbidden();

    expect($user->fresh()->status)->toBe(UserStatus::Pending);
});

test('the status must be a known value', function () {
    $user = User::factory()->pending()->create();

    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $user), ['status' => 'banned'])
        ->assertSessionHasErrors('status');
});

test('the user list filters by status and counts each status', function () {
    $hei = createSurveyHei();
    User::factory()->pending()->create(['name' => 'Awaiting Approval', 'survey_hei_id' => $hei->id]);
    User::factory()->inactive()->create();

    $this->actingAs($this->admin)
        ->get(route('settings.users.index', ['status' => 'pending']))
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/users')
            ->where('filters.status', 'pending')
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Awaiting Approval')
            ->where('users.data.0.status', 'pending')
            ->where('users.data.0.hei.name', $hei->name)
            ->where('statusCounts', ['pending' => 1, 'active' => 1, 'inactive' => 1])
            // The Central Office is offered every institution.
            ->has('heis', 1));
});

test('pending registrations are listed first', function () {
    User::factory()->create(['name' => 'Aaron Active']);
    User::factory()->pending()->create(['name' => 'Zed Pending']);

    $this->actingAs($this->admin)
        ->get(route('settings.users.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('users.data.0.name', 'Zed Pending'));
});

test('administrators set an HEI account\'s institution; contact details stay the account holder\'s', function () {
    $hei = createSurveyHei();
    $user = User::factory()->create(['mobile_number' => '09171234567', 'sex' => 'female']);
    $user->assignRole('hei');
    $heiRole = Role::query()->where('slug', 'hei')->sole();

    $this->actingAs($this->admin)
        ->put(route('settings.users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'survey_hei_id' => $hei->id,
            'mobile_number' => '+63 918 765 4321',
            'sex' => 'male',
            'password' => '',
            'password_confirmation' => '',
            'role_ids' => [$heiRole->id],
        ])
        ->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->survey_hei_id)->toBe($hei->id)
        // Set by the account holder on their Profile, never overwritten here.
        ->and($user->mobile_number)->toBe('09171234567')
        ->and($user->sex)->toBe('female');
});

test('an HEI account needs its institution, and a CHED account has none', function () {
    $hei = createSurveyHei();
    $heiRole = Role::query()->where('slug', 'hei')->sole();
    $heiFocalRole = Role::query()->where('slug', 'hei-focal')->sole();
    $chedRole = Role::query()->where('slug', 'ched-employee')->sole();
    $payload = fn (array $roleIds, array $overrides = []): array => [
        'name' => 'New Account',
        'email' => 'new-account@example.test',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role_ids' => $roleIds,
        ...$overrides,
    ];

    $this->actingAs($this->admin);
    $this->post(route('settings.users.store'), $payload([$heiFocalRole->id]))
        ->assertSessionHasErrors(['survey_hei_id' => 'Choose the institution this HEI account belongs to.']);
    expect(User::query()->where('email', 'new-account@example.test')->exists())->toBeFalse();

    // A CHED account is placed by its office, so an institution sent with it is dropped.
    $this->post(route('settings.users.store'), $payload([$chedRole->id], ['survey_hei_id' => $hei->id, 'survey_region_id' => $hei->cluster->survey_region_id]))
        ->assertSessionHasNoErrors();
    $staff = User::query()->where('email', 'new-account@example.test')->sole();
    expect($staff->survey_hei_id)->toBeNull();

    // Becoming an HEI account needs the institution too.
    $this->put(route('settings.users.update', $staff), $payload([$heiRole->id], ['password' => '', 'password_confirmation' => '']))
        ->assertSessionHasErrors('survey_hei_id');
    $this->put(route('settings.users.update', $staff), $payload([$heiRole->id], [
        'password' => '', 'password_confirmation' => '', 'survey_hei_id' => $hei->id,
    ]))->assertSessionHasNoErrors();
    expect($staff->fresh()->survey_hei_id)->toBe($hei->id);
});

test('the user form lists institutions with their region', function () {
    $hei = createSurveyHei(['name' => 'Example College']);
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('admin');

    $this->actingAs($central)->get(route('settings.users.index'))->assertInertia(fn (Assert $page) => $page
        ->where('heis', [['id' => $hei->id, 'name' => 'Example College', 'region_id' => $hei->cluster->survey_region_id]])
        ->where('heiRegions', [['id' => $hei->cluster->survey_region_id, 'name' => 'Regional Office XII']]));
});

test('a regional office\'s user form lists only its own region\'s institutions', function () {
    $own = createSurveyHei(['name' => 'Own College']);
    $elsewhere = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    SurveyHei::query()->create(['survey_cluster_id' => SurveyCluster::holdingFor($elsewhere->id)->id, 'name' => 'Other College', 'is_active' => true]);
    $manager = User::factory()->regionalOffice($own->cluster->region)->create();
    $manager->assignRole('admin');

    $this->actingAs($manager)->get(route('settings.users.index'))->assertInertia(fn (Assert $page) => $page
        ->where('heis', [['id' => $own->id, 'name' => 'Own College', 'region_id' => $own->cluster->survey_region_id]])
        ->has('heiRegions', 1));
});
