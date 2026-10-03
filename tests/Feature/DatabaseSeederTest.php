<?php

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\SurveyDirectorySeeder;
use Database\Seeders\SurveyHeiSeeder;
use Database\Seeders\SurveyRegionSeeder;
use Illuminate\Support\Facades\Hash;

test('default seed creates the admin, survey drafts and all 129 supplied HEIs', function () {
    $this->seed(DatabaseSeeder::class);

    $admin = User::query()->sole();
    expect($admin->email)->toBe('admin@gmail.com')
        ->and(Hash::check('12345678', $admin->password))->toBeTrue()
        ->and($admin->password)->not->toBe('12345678')
        ->and($admin->email_verified_at)->not->toBeNull()
        ->and($admin->hasRole('admin'))->toBeTrue()
        ->and($admin->can('surveys.publish'))->toBeTrue()
        ->and($admin->can('survey-directories.update'))->toBeTrue()
        ->and($admin->can('monitoring.review'))->toBeTrue()
        ->and($admin->national_access)->toBeTrue()
        ->and(SurveyRegion::query()->where('name', 'Regional Office XII')->sole()->only(SurveyRegion::OFFICE_FIELDS))
        ->toBe(SurveyDirectorySeeder::REGION_XII_OFFICE)
        ->and(SurveyRegion::query()->count())->toBe(17)
        ->and(SurveyRegion::query()->where('is_active', true)->count())->toBe(17)
        ->and(SurveyRegion::query()->where('name', 'Regional Office XII')->exists())->toBeTrue()
        ->and(SurveyRegion::query()->orderBy('id')->pluck('name')->all())
        ->toBe(array_keys(SurveyRegionSeeder::OFFICES))
        ->and(SurveyHei::query()->count())->toBe(129)
        ->and(SurveyHei::query()->where('is_active', true)->count())->toBe(129)
        ->and(SurveyHei::query()->where('ownership', 'public')->count())->toBe(22)
        ->and(SurveyHei::query()->where('ownership', 'private')->count())->toBe(107)
        ->and(SurveyHei::query()->whereHas('cluster', fn ($query) => $query->where('name', 'Unassigned'))->count())->toBe(129)
        ->and(SurveyHei::query()->whereNotNull('portal_synced_at')->count())->toBe(0);
    expect(SurveyHei::query()->where('uii', '12008d')->sole()->name)->toBe('COTABATO FOUNDATION COLLEGE OF SCIENCE AND TECHNOLOGY - PIKIT')
        ->and(SurveyHei::query()->where('uii', '12074i')->sole()->name)->toBe('SULTAN KUDARAT STATE UNIVERSITY-SNA')
        ->and(SurveyHei::query()->where('uii', '12153')->sole()->ownership)->toBe('public');
    foreach (Survey::query()->get() as $survey) {
        expect($survey->draftVersion())->not->toBeNull()
            ->and($survey->publishedVersion())->toBeNull();
    }
    $this->post(route('login.store'), ['email' => 'admin@gmail.com', 'password' => '12345678'])
        ->assertSessionHasNoErrors()->assertRedirect(route('dashboard', absolute: false));
    $this->assertAuthenticatedAs($admin);
});

test('the local demo seed adds one account per role, placed in Region XII', function () {
    // DatabaseSeeder only runs this in the local environment.
    $this->seed(DatabaseSeeder::class);
    $this->seed(DemoUserSeeder::class);
    $region = SurveyRegion::query()->where('name', 'Regional Office XII')->sole();
    $accounts = User::query()->where('email', 'like', '%@phlgadis.test')->with('roles', 'hei.cluster')->get()->keyBy('email');

    expect($accounts)->toHaveCount(4);
    foreach (['ched-focal', 'ched-employee'] as $role) {
        $staff = $accounts["{$role}@phlgadis.test"];
        expect($staff->hasRole($role))->toBeTrue()
            ->and($staff->survey_region_id)->toBe($region->id)
            ->and($staff->national_access)->toBeFalse()
            ->and($staff->isHeiOnly())->toBeFalse();
    }
    foreach (['hei-focal', 'hei'] as $role) {
        $member = $accounts["{$role}@phlgadis.test"];
        expect($member->hasRole($role))->toBeTrue()
            ->and($member->hei->cluster->survey_region_id)->toBe($region->id)
            ->and($member->survey_region_id)->toBeNull()
            ->and($member->isHeiOnly())->toBeTrue();
    }
    expect($accounts['hei-focal@phlgadis.test']->can('monitoring.submit'))->toBeTrue()
        ->and($accounts['hei@phlgadis.test']->can('monitoring.submit'))->toBeFalse()
        ->and($accounts['ched-focal@phlgadis.test']->can('monitoring.review'))->toBeTrue()
        ->and($accounts['ched-employee@phlgadis.test']->can('monitoring.review'))->toBeFalse();

    $this->post(route('login.store'), ['email' => 'hei-focal@phlgadis.test', 'password' => '12345678'])
        ->assertSessionHasNoErrors()->assertRedirect(route('dashboard', absolute: false));
});

test('repeat seeding keeps HEI IDs, operator edits, deactivations and changed admin passwords', function () {
    $this->seed(DatabaseSeeder::class);
    $admin = User::query()->sole();
    $admin->update(['name' => 'Edited Administrator', 'password' => 'changed-password']);
    $passwordHash = $admin->fresh()->password;
    $hei = SurveyHei::query()->where('uii', '12120')->sole();
    $cluster = SurveyCluster::query()->where('name', 'South Cotabato')->sole();
    $hei->update(['name' => 'Edited institutional name', 'survey_cluster_id' => $cluster->id, 'is_active' => false]);
    $existing = $hei->fresh()->getAttributes();

    $this->seed(DatabaseSeeder::class);

    expect(User::query()->count())->toBe(1)
        ->and($admin->fresh()->password)->toBe($passwordHash)
        ->and($admin->fresh()->name)->toBe('Edited Administrator')
        ->and(SurveyHei::query()->count())->toBe(129)
        ->and($hei->fresh()->getAttributes())->toBe($existing)
        ->and(SurveyCluster::query()->count())->toBe(5);
});

test('seeding an existing database does not promote its first user to admin', function () {
    $existing = User::factory()->create();

    $this->seed(DatabaseSeeder::class);

    expect($existing->fresh()->hasRole('admin'))->toBeFalse()
        ->and($existing->fresh()->hasRole('hei'))->toBeTrue()
        ->and(User::query()->where('email', 'admin@gmail.com')->sole()->hasRole('admin'))->toBeTrue();
});

test('seeding refuses to promote an existing non-admin account with the seed email', function () {
    $existing = User::factory()->create(['email' => 'admin@gmail.com']);

    expect(fn () => $this->seed(DatabaseSeeder::class))
        ->toThrow(RuntimeException::class, 'admin@gmail.com already belongs to a non-admin user');
    expect($existing->fresh()->hasRole('admin'))->toBeFalse();
});

test('HEI seed adopts manual entries without replacing their identity or cluster', function () {
    $this->seed(SurveyDirectorySeeder::class);
    $cluster = SurveyCluster::query()->where('name', 'South Cotabato')->sole();
    $hei = SurveyHei::query()->create([
        'name' => 'ACLC College of Marbel', 'survey_cluster_id' => $cluster->id,
        'ownership' => null, 'is_active' => false,
    ]);

    $this->seed(SurveyHeiSeeder::class);

    expect(SurveyHei::query()->count())->toBe(129)
        ->and(SurveyHei::query()->where('uii', '12120')->sole()->id)->toBe($hei->id)
        ->and($hei->fresh()->name)->toBe('ACLC College of Marbel')
        ->and($hei->fresh()->survey_cluster_id)->toBe($cluster->id)
        ->and($hei->fresh()->is_active)->toBeFalse()
        ->and($hei->fresh()->ownership)->toBe('private');
});

test('ambiguous manual HEI matches roll back the import instead of duplicating records', function () {
    $this->seed(SurveyDirectorySeeder::class);
    foreach (SurveyCluster::query()->limit(2)->get() as $cluster) {
        SurveyHei::query()->create(['name' => 'ACLC COLLEGE OF MARBEL', 'survey_cluster_id' => $cluster->id, 'is_active' => true]);
    }

    expect(fn () => $this->seed(SurveyHeiSeeder::class))->toThrow(RuntimeException::class, 'Multiple manual HEIs match 12120');
    expect(SurveyHei::query()->count())->toBe(2)
        ->and(SurveyHei::query()->whereNotNull('uii')->count())->toBe(0)
        ->and(SurveyCluster::query()->where('name', 'Unassigned')->exists())->toBeFalse();
});
