<?php

use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\ActivitySubjects;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => false]);
});

test('directory managers keep a regional office\'s letterhead up to date', function () {
    // Administrators are Central Office staff.
    $admin = User::factory()->nationalOffice()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->put(route('settings.regions.office', $this->region), [
        'office_city' => 'Koronadal City',
        'office_address' => 'PRIME Government Center, Koronadal',
        'office_email' => 'chedro12@ched.gov.ph',
        'office_website' => 'chedro12.gov.ph',
        'office_phone' => '(083) 228-7572',
    ])->assertSessionHasNoErrors();

    $region = $this->region->fresh();
    expect($region->office_city)->toBe('Koronadal City')
        ->and($region->office_email)->toBe('chedro12@ched.gov.ph')
        // The office's details leave its name and status alone.
        ->and($region->name)->toBe('Regional Office XII')
        ->and($region->is_active)->toBeFalse();

    $this->put(route('settings.regions.office', $this->region), ['office_email' => 'not an email', 'office_website' => 'no spaces allowed'])
        ->assertSessionHasErrors(['office_email', 'office_website']);

    $this->put(route('settings.regions.office', $this->region), ['office_city' => null])->assertSessionHasNoErrors();
    expect($this->region->fresh()->office_city)->toBeNull();
});

test('only those who keep office details change them', function () {
    $hei = User::factory()->create();
    $hei->assignRole('hei');

    $this->actingAs($hei)
        ->put(route('settings.regions.office', $this->region), ['office_city' => 'Elsewhere'])
        ->assertForbidden();
});

test('a CHED Focal keeps their own region\'s office details, and no other region\'s', function () {
    $other = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
    $focal = User::factory()->regionalOffice($this->region)->create();
    $focal->assignRole('ched-focal');

    $this->actingAs($focal)
        ->put(route('settings.regions.office', $this->region), ['office_city' => 'Koronadal City', 'office_phone' => '(083) 228-7572'])
        ->assertSessionHasNoErrors()
        ->assertInertiaFlash('toast.message', 'Office details saved for Regional Office XII.');
    expect($this->region->fresh()->office_city)->toBe('Koronadal City');

    $this->actingAs($focal)
        ->put(route('settings.regions.office', $other), ['office_city' => 'Elsewhere'])
        ->assertForbidden();
    expect($other->fresh()->office_city)->toBeNull();

    // The change is filed under the region, and links back to its page.
    expect(ActivityLog::query()->latest('id')->firstOrFail()->survey_region_id)->toBe($this->region->id)
        ->and(ActivitySubjects::url($this->region, $focal))->toBe(route('settings.regions.index'));
});

test('a CHED Focal\'s regions page lists their own region, with only its office details to change', function () {
    SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
    $focal = User::factory()->regionalOffice($this->region)->create();
    $focal->assignRole('ched-focal');

    $this->actingAs($focal)->get(route('settings.regions.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/regions')
            ->has('regions.data', 1)
            ->where('regions.data.0.name', 'Regional Office XII')
            ->where('regions.data.0.can_edit_office', true)
            ->where('permissions', ['create' => false, 'update' => false, 'delete' => false]));

    // The Central Office sees every region, and keeps each one's details.
    $admin = User::factory()->nationalOffice()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get(route('settings.regions.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('regions.data', 2)
            ->where('regions.data.0.can_edit_office', true)
            ->where('regions.data.1.can_edit_office', true));
});

test('other staff and HEI accounts neither open the regions page nor change office details', function () {
    $employee = User::factory()->regionalOffice($this->region)->create();
    $employee->assignRole('ched-employee');
    $hei = User::factory()->create();
    $hei->assignRole('hei');

    foreach ([$employee, $hei] as $user) {
        $this->actingAs($user)->get(route('settings.regions.index'))->assertForbidden();
        $this->actingAs($user)
            ->put(route('settings.regions.office', $this->region), ['office_city' => 'Elsewhere'])
            ->assertForbidden();
    }

    expect($this->region->fresh()->office_city)->toBeNull();
});

test('the migration lets existing CHED Focal and directory roles keep office details', function () {
    // As in production before it: no such permission yet.
    DB::table('permissions')->where('slug', 'region-offices.update')->delete();
    $keeper = Role::query()->create(['name' => 'Directory Keeper', 'slug' => 'directory-keeper']);
    $keeper->permissions()->attach(DB::table('permissions')->where('slug', 'survey-directories.update')->value('id'));
    $holds = fn (string $role): bool => Role::query()->where('slug', $role)->sole()
        ->permissions()->where('slug', 'region-offices.update')->exists();

    $migration = require database_path('migrations/2026_10_17_000000_let_ched_focal_update_region_offices.php');
    $migration->up();

    expect($holds('admin'))->toBeTrue()
        ->and($holds('ched-focal'))->toBeTrue()
        ->and($holds('directory-keeper'))->toBeTrue()
        ->and($holds('ched-employee'))->toBeFalse();

    $migration->down();
    expect(DB::table('permissions')->where('slug', 'region-offices.update')->exists())->toBeFalse();
});
