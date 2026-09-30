<?php

use App\Models\Role;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII']);
    $this->xi = SurveyRegion::query()->create(['name' => 'Regional Office XI']);
    $this->focalRole = Role::query()->where('slug', 'gad-focal-person')->sole();
    $this->heiRole = Role::query()->where('slug', 'hei')->sole();
});

/** @param  array<string, mixed>  $overrides */
function officeUserPayload(array $roleIds, array $overrides = []): array
{
    return [
        'name' => 'Staff Member',
        'email' => 'staff@example.test',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role_ids' => $roleIds,
        ...$overrides,
    ];
}

function officeAdmin(?SurveyRegion $region = null): User
{
    $admin = ($region ? User::factory()->regionalOffice($region) : User::factory()->nationalOffice())->create();
    $admin->assignRole('admin');

    return $admin;
}

test('Central Office staff place accounts in any office', function () {
    $admin = officeAdmin();

    $this->actingAs($admin)
        ->post(route('settings.users.store'), officeUserPayload([$this->focalRole->id], ['survey_region_id' => $this->xi->id]))
        ->assertSessionHasNoErrors();
    $staff = User::query()->where('email', 'staff@example.test')->sole();
    expect($staff->survey_region_id)->toBe($this->xi->id)->and($staff->national_access)->toBeFalse();

    $this->put(route('settings.users.update', $staff), officeUserPayload([$this->focalRole->id], [
        'email' => $staff->email, 'password' => '', 'password_confirmation' => '', 'national_access' => true,
    ]))->assertSessionHasNoErrors();
    expect($staff->fresh()->national_access)->toBeTrue()->and($staff->fresh()->survey_region_id)->toBeNull();

    $this->get(route('settings.users.index'))->assertInertia(fn (Assert $page) => $page
        ->where('offices.national', true)
        ->has('offices.regions', 2));
});

test('regional staff place accounts only in their own office', function () {
    $admin = officeAdmin($this->xii);

    $this->actingAs($admin)
        ->post(route('settings.users.store'), officeUserPayload([$this->focalRole->id], ['national_access' => true]))
        ->assertSessionHasErrors('national_access');
    $this->post(route('settings.users.store'), officeUserPayload([$this->focalRole->id], ['survey_region_id' => $this->xi->id]))
        ->assertSessionHasErrors('survey_region_id');
    $this->post(route('settings.users.store'), officeUserPayload([$this->focalRole->id], ['survey_region_id' => $this->xii->id]))
        ->assertSessionHasNoErrors();

    $this->get(route('settings.users.index'))->assertInertia(fn (Assert $page) => $page
        ->where('offices.national', false)
        ->has('offices.regions', 1)
        ->where('offices.regions.0.name', 'Regional Office XII'));

    // Accounts in another office, or the Central Office, are out of reach.
    $central = officeAdmin();
    $elsewhere = User::factory()->regionalOffice($this->xi)->create();
    $elsewhere->assignRole('gad-focal-person');

    foreach ([$central, $elsewhere] as $target) {
        $this->put(route('settings.users.update', $target), officeUserPayload([$this->focalRole->id], [
            'email' => $target->email, 'password' => '', 'password_confirmation' => '', 'survey_region_id' => $this->xii->id,
        ]))->assertSessionHasErrors('user');
        $this->patch(route('settings.users.status', $target), ['status' => 'inactive']);
        expect($target->fresh()->status->value)->toBe('active');
    }
});

test('HEI accounts never hold an office and cannot set one themselves', function () {
    $admin = officeAdmin();

    $this->actingAs($admin)
        ->post(route('settings.users.store'), officeUserPayload([$this->heiRole->id], ['national_access' => true]))
        ->assertSessionHasNoErrors();
    $hei = User::query()->where('email', 'staff@example.test')->sole();
    expect($hei->national_access)->toBeFalse()->and($hei->survey_region_id)->toBeNull();

    // An HEI's focal person is an HEI account too; their region comes through the HEI.
    $heiFocalRole = Role::query()->where('slug', 'hei-focal')->sole();
    $this->post(route('settings.users.store'), officeUserPayload([$this->heiRole->id, $heiFocalRole->id], [
        'email' => 'focal@example.test', 'survey_region_id' => $this->xi->id,
    ]))->assertSessionHasNoErrors();
    $focal = User::query()->where('email', 'focal@example.test')->sole();
    expect($focal->national_access)->toBeFalse()->and($focal->survey_region_id)->toBeNull();

    $this->get(route('settings.users.index'))->assertInertia(fn (Assert $page) => $page
        ->where('roles', fn ($roles) => collect($roles)->mapWithKeys(fn (array $role): array => [$role['slug'] => $role['hei']])->all() === [
            'admin' => false, 'ched-employee' => false, 'ched-focal' => false, 'gad-focal-person' => false, 'hei-focal' => true, 'hei' => true,
        ]));

    $this->post(route('settings.users.store'), officeUserPayload([$this->focalRole->id], [
        'email' => 'both@example.test', 'national_access' => true, 'survey_region_id' => $this->xi->id,
    ]))->assertSessionHasErrors('survey_region_id');

    // Profile and registration forms cannot grant access either.
    $this->actingAs($hei)->patch(route('profile.update'), [
        'name' => $hei->name, 'email' => $hei->email, 'national_access' => true, 'survey_region_id' => $this->xi->id,
    ]);
    expect($hei->fresh()->national_access)->toBeFalse()->and($hei->fresh()->survey_region_id)->toBeNull();
});

test('a region with staff in its office cannot be deleted', function () {
    $admin = officeAdmin();
    User::factory()->regionalOffice($this->xi)->create();

    $this->actingAs($admin)->delete(route('settings.survey-directories.destroy', ['type' => 'regions', 'id' => $this->xi->id]));

    expect(SurveyRegion::query()->whereKey($this->xi->id)->exists())->toBeTrue();
});
