<?php

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
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
    $institution = createSurveyHei();

    $this->actingAs($admin)
        ->post(route('settings.users.store'), officeUserPayload([$this->heiRole->id], [
            'national_access' => true, 'survey_hei_id' => $institution->id,
        ]))
        ->assertSessionHasNoErrors();
    $hei = User::query()->where('email', 'staff@example.test')->sole();
    expect($hei->national_access)->toBeFalse()->and($hei->survey_region_id)->toBeNull();

    // An HEI's focal person is an HEI account too; their region comes through the HEI.
    $heiFocalRole = Role::query()->where('slug', 'hei-focal')->sole();
    $this->post(route('settings.users.store'), officeUserPayload([$this->heiRole->id, $heiFocalRole->id], [
        'email' => 'focal@example.test', 'survey_region_id' => $this->xi->id, 'survey_hei_id' => $institution->id,
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

test('a regional office lists and manages only its own region\'s HEI accounts', function () {
    $clusterXi = SurveyCluster::query()->create(['survey_region_id' => $this->xi->id, 'name' => 'Davao', 'is_active' => true]);
    $clusterXii = SurveyCluster::query()->create(['survey_region_id' => $this->xii->id, 'name' => 'South Cotabato', 'is_active' => true]);
    $theirs = User::factory()->create(['name' => 'Davao Member', 'survey_hei_id' => SurveyHei::query()->create(['survey_cluster_id' => $clusterXi->id, 'name' => 'Davao College', 'is_active' => true])->id]);
    $theirs->assignRole('hei');
    $ours = User::factory()->create(['name' => 'Marbel Member', 'survey_hei_id' => SurveyHei::query()->create(['survey_cluster_id' => $clusterXii->id, 'name' => 'Marbel College', 'is_active' => true])->id]);
    $ours->assignRole('hei');
    $admin = officeAdmin($this->xii);

    $this->actingAs($admin)->get(route('settings.users.index', ['search' => 'Member']))
        ->assertInertia(fn (Assert $page) => $page->has('users.data', 1)->where('users.data.0.name', 'Marbel Member'));

    $this->actingAs($admin)->patch(route('settings.users.status', $theirs), ['status' => 'inactive'])
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');
    expect($theirs->fresh()->status)->toBe(UserStatus::Active);

    $this->actingAs($admin)->patch(route('settings.users.status', $ours), ['status' => 'inactive']);
    expect($ours->fresh()->status)->toBe(UserStatus::Inactive);
});

test('an Administrator always covers every region, whatever office is sent', function () {
    $adminRole = Role::query()->where('slug', 'admin')->sole();

    $this->actingAs(officeAdmin())
        ->post(route('settings.users.store'), officeUserPayload([$adminRole->id], ['email' => 'second-admin@example.test', 'survey_region_id' => $this->xi->id]))
        ->assertSessionHasNoErrors();

    $second = User::query()->where('email', 'second-admin@example.test')->sole();
    expect($second->national_access)->toBeTrue()->and($second->survey_region_id)->toBeNull();
});

test('admins given a regional office before become Central Office', function () {
    $regional = officeAdmin($this->xii);
    $focal = User::factory()->regionalOffice($this->xii)->create();
    $focal->assignRole('ched-focal');

    (require database_path('migrations/2026_10_07_000000_make_administrators_national.php'))->up();

    expect($regional->fresh()->national_access)->toBeTrue()
        ->and($regional->fresh()->survey_region_id)->toBeNull()
        ->and($focal->fresh()->survey_region_id)->toBe($this->xii->id);
});

test('CHED Focal and CHED Employee accounts always belong to one regional office', function () {
    $admin = officeAdmin();
    $this->actingAs($admin);

    foreach (['ched-focal', 'ched-employee'] as $slug) {
        $role = Role::query()->where('slug', $slug)->sole();

        $this->post(route('settings.users.store'), officeUserPayload([$role->id], ['national_access' => true]))
            ->assertSessionHasErrors(['national_access' => 'CHED Focal and CHED Employee accounts belong to one region. Only Administrators cover every region.']);
        $this->post(route('settings.users.store'), officeUserPayload([$role->id], ['national_access' => false, 'survey_region_id' => null]))
            ->assertSessionHasErrors(['survey_region_id' => 'Choose the regional office this CHED account belongs to.']);
        $this->post(route('settings.users.store'), officeUserPayload([$role->id], ['email' => "{$slug}@example.test", 'survey_region_id' => $this->xi->id]))
            ->assertSessionHasNoErrors();

        $account = User::query()->where('email', "{$slug}@example.test")->sole();
        expect($account->survey_region_id)->toBe($this->xi->id)->and($account->national_access)->toBeFalse();

        // Moving one to the Central Office later is refused too.
        $this->put(route('settings.users.update', $account), officeUserPayload([$role->id], [
            'email' => $account->email, 'password' => '', 'password_confirmation' => '', 'national_access' => true,
        ]))->assertSessionHasErrors('national_access');
        expect($account->fresh()->national_access)->toBeFalse();
    }

    // Other staff roles may still be Central Office, and an Administrator always is.
    $this->post(route('settings.users.store'), officeUserPayload([$this->focalRole->id], ['email' => 'content@example.test', 'national_access' => true]))
        ->assertSessionHasNoErrors();
    $adminRole = Role::query()->where('slug', 'admin')->sole();
    $chedFocal = Role::query()->where('slug', 'ched-focal')->sole();
    $this->post(route('settings.users.store'), officeUserPayload([$adminRole->id, $chedFocal->id], ['email' => 'both-roles@example.test']))
        ->assertSessionHasNoErrors();
    expect(User::query()->where('email', 'both-roles@example.test')->sole()->national_access)->toBeTrue();
});

test('every page tells the account where it belongs', function () {
    $focal = User::factory()->regionalOffice($this->xii)->create();
    $focal->assignRole('ched-focal');

    $this->actingAs($focal)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.affiliation', 'CHED Regional Office XII')
            ->where('auth.officeRegion', 'Regional Office XII'));

    $this->actingAs(officeAdmin())->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.affiliation', 'CHED Central Office')
            ->where('auth.officeRegion', null));
});
