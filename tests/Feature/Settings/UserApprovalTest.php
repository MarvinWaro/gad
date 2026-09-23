<?php

use App\Enums\UserStatus;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->create();
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
        ->assertSessionHasErrors('user');

    expect($this->admin->fresh()->status)->toBe(UserStatus::Active);
});

test('the last active administrator cannot be deactivated', function () {
    // Every permission, but not the admin role itself.
    $operatorRole = Role::query()->create(['name' => 'Operator', 'slug' => 'operator']);
    $operatorRole->permissions()->sync(Permission::query()->pluck('id'));
    $operator = User::factory()->create();
    $operator->assignRole($operatorRole);

    $this->actingAs($operator)
        ->patch(route('settings.users.status', $this->admin), ['status' => 'inactive'])
        ->assertSessionHasErrors('user');
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

test('administrators can set institution, mobile number, and sex on accounts', function () {
    $hei = createSurveyHei();
    $user = User::factory()->create();
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
        ->and($user->mobile_number)->toBe('09187654321')
        ->and($user->sex)->toBe('male');
});
