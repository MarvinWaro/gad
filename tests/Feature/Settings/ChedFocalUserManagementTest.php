<?php

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII']);
    $this->xi = SurveyRegion::query()->create(['name' => 'Regional Office XI']);
    $this->ourHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $this->xii->id, 'name' => 'South Cotabato', 'is_active' => true])->id,
        'name' => 'Marbel College',
        'is_active' => true,
    ]);
    $this->theirHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $this->xi->id, 'name' => 'Davao', 'is_active' => true])->id,
        'name' => 'Davao College',
        'is_active' => true,
    ]);
    $this->focal = User::factory()->regionalOffice($this->xii)->create();
    $this->focal->assignRole('ched-focal');
});

/** @param  array<string, mixed>  $overrides */
function chedFocalPayload(array $roleSlugs, array $overrides = []): array
{
    return [
        'name' => 'New Member',
        'email' => 'new@example.test',
        'role_ids' => Role::query()->whereIn('slug', $roleSlugs)->pluck('id')->all(),
        ...$overrides,
    ];
}

function heiAccountAt(SurveyHei $hei, string $name, ?UserStatus $status = null): User
{
    $member = User::factory()->create(['name' => $name, 'survey_hei_id' => $hei->id, 'status' => $status ?? UserStatus::Active]);
    $member->assignRole('hei');

    return $member;
}

test('a CHED Focal lists and approves registrations from their own region only', function () {
    $ours = heiAccountAt($this->ourHei, 'Marbel Member', UserStatus::Pending);
    $theirs = heiAccountAt($this->theirHei, 'Davao Member', UserStatus::Pending);
    $this->actingAs($this->focal);

    $this->get(route('settings.users.index', ['search' => 'Member']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Marbel Member')
            ->where('users.data.0.can_manage', true)
            ->where('permissions.create', true)
            ->where('permissions.update', true)
            ->where('permissions.delete', false));

    $this->patch(route('settings.users.status', $ours), ['status' => 'active'])->assertSessionHasNoErrors();
    $this->patch(route('settings.users.status', $theirs), ['status' => 'active'])
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');

    expect($ours->fresh()->status)->toBe(UserStatus::Active)
        ->and($theirs->fresh()->status)->toBe(UserStatus::Pending);
});

test('a CHED Focal creates HEI accounts at their own region\'s institutions and names HEI Focals', function () {
    $this->actingAs($this->focal);

    $this->post(route('settings.users.store'), chedFocalPayload(['hei', 'hei-focal'], ['survey_hei_id' => $this->ourHei->id]))
        ->assertSessionHasNoErrors();
    $created = User::query()->where('email', 'new@example.test')->sole();
    expect($created->survey_hei_id)->toBe($this->ourHei->id)
        ->and($created->can('monitoring.submit'))->toBeTrue();

    $this->post(route('settings.users.store'), chedFocalPayload(['hei'], ['email' => 'davao@example.test', 'survey_hei_id' => $this->theirHei->id]))
        ->assertSessionHasErrors(['survey_hei_id' => 'You can only place accounts at institutions in your own region.']);
    expect(User::query()->where('email', 'davao@example.test')->exists())->toBeFalse();

    // Promoting a registrant to HEI Focal, but not moving them to another region.
    $member = heiAccountAt($this->ourHei, 'Marbel Member');
    $this->put(route('settings.users.update', $member), chedFocalPayload(['hei', 'hei-focal'], [
        'email' => $member->email, 'survey_hei_id' => $this->ourHei->id,
    ]))->assertSessionHasNoErrors();
    expect($member->fresh()->can('monitoring.submit'))->toBeTrue();

    $this->put(route('settings.users.update', $member), chedFocalPayload(['hei'], [
        'email' => $member->email, 'survey_hei_id' => $this->theirHei->id,
    ]))->assertSessionHasErrors('survey_hei_id');
    expect($member->fresh()->survey_hei_id)->toBe($this->ourHei->id);
});

test('a CHED Focal creates CHED Employees in their office, but never other managers', function () {
    $this->actingAs($this->focal);

    $this->get(route('settings.users.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('roles', fn ($roles) => collect($roles)->pluck('slug')->sort()->values()->all() === ['ched-employee', 'hei', 'hei-focal']));

    $this->post(route('settings.users.store'), chedFocalPayload(['ched-employee'], ['survey_region_id' => $this->xii->id]))
        ->assertSessionHasNoErrors();
    expect(User::query()->where('email', 'new@example.test')->sole()->survey_region_id)->toBe($this->xii->id);

    foreach (['ched-focal', 'admin'] as $slug) {
        $this->post(route('settings.users.store'), chedFocalPayload([$slug], ['email' => "{$slug}@example.test", 'survey_region_id' => $this->xii->id]))
            ->assertSessionHasErrors('role_ids');
    }

    // A fellow CHED Focal is the Administrator's to manage.
    $colleague = User::factory()->regionalOffice($this->xii)->create(['name' => 'Fellow Focal']);
    $colleague->assignRole('ched-focal');
    $this->get(route('settings.users.index', ['search' => 'Fellow Focal']))
        ->assertInertia(fn (Assert $page) => $page->where('users.data.0.can_manage', false));
    $this->patch(route('settings.users.status', $colleague), ['status' => 'inactive'])
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');
    expect($colleague->fresh()->status)->toBe(UserStatus::Active);
});

test('a CHED Focal cannot delete accounts', function () {
    $member = heiAccountAt($this->ourHei, 'Marbel Member');

    $this->actingAs($this->focal)->delete(route('settings.users.destroy', $member))->assertForbidden();

    expect(User::query()->whereKey($member->id)->exists())->toBeTrue();
});

test('the migration lets an existing CHED Focal role manage its region\'s accounts', function () {
    $role = Role::query()->where('slug', 'ched-focal')->sole();
    $managing = DB::table('permissions')->whereIn('slug', ['users.view', 'users.create', 'users.update'])->pluck('id');
    $role->permissions()->detach($managing);

    $migration = require database_path('migrations/2026_10_13_000000_let_ched_focal_manage_regional_accounts.php');
    $migration->up();

    expect($this->focal->fresh()->permissionSlugs())
        ->toContain('users.view', 'users.create', 'users.update')
        ->not->toContain('users.delete');

    $migration->down();
    expect($this->focal->fresh()->permissionSlugs())->not->toContain('users.view');
});
