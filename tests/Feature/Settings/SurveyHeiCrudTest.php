<?php

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveyDirectorySeeder;
use Database\Seeders\SurveySeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class, SurveyDirectorySeeder::class]);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    $this->cluster = SurveyCluster::query()->where('name', 'South Cotabato')->sole();
});

function heiPayload(array $overrides = []): array
{
    return [...[
        'uii' => '12001',
        'name' => 'Notre Dame of Marbel University',
        'ownership' => 'private',
        'survey_region_id' => test()->cluster->survey_region_id,
    ], ...$overrides];
}

test('an HEI is created with its UII, region and ownership', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $hei = SurveyHei::query()->where('uii', '12001')->sole();

    expect($hei->name)->toBe('Notre Dame of Marbel University')
        ->and($hei->ownership)->toBe('private')
        ->and($hei->is_active)->toBeTrue()
        ->and($hei->cluster->region->name)->toBe('Regional Office XII');
});

test('the UII is optional so an institution can be entered before its code is known', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload(['uii' => null]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SurveyHei::query()->sole()->uii)->toBeNull();
});

test('a UII cannot be reused by a second institution', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());

    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload([
            'name' => 'A Different College',
        ]))
        ->assertSessionHasErrors('uii');

    expect(SurveyHei::query()->count())->toBe(1);
});

test('ownership only accepts public or private', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload([
            'ownership' => 'sectarian',
        ]))
        ->assertSessionHasErrors('ownership');
});

test('a UII with unexpected characters is rejected', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload([
            'uii' => '12 001/XII',
        ]))
        ->assertSessionHasErrors('uii');
});

test('an HEI needs only its region, and waits in the region\'s holding cluster', function () {
    $region = $this->cluster->region;
    foreach (['Notre Dame of Marbel University' => '12001', 'Koronadal College' => '12002'] as $name => $uii) {
        $this->actingAs($this->admin)
            ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload([
                'uii' => $uii,
                'name' => $name,
            ]))
            ->assertSessionHasNoErrors();
    }

    $clusters = SurveyHei::query()->with('cluster')->get()->pluck('cluster');

    expect($clusters->pluck('name')->unique()->all())->toBe([SurveyCluster::UNASSIGNED])
        ->and($clusters->pluck('id')->unique())->toHaveCount(1)
        ->and($clusters->first()->survey_region_id)->toBe($region->id);
});

test('an HEI without a cluster joins the region\'s others when they share one', function () {
    SurveyHei::query()->create(['survey_cluster_id' => $this->cluster->id, 'name' => 'Placed College', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload())
        ->assertSessionHasNoErrors();

    // No second, holding cluster appears.
    expect(SurveyHei::query()->where('uii', '12001')->sole()->survey_cluster_id)->toBe($this->cluster->id)
        ->and(SurveyCluster::query()->where('name', SurveyCluster::UNASSIGNED)->exists())->toBeFalse();
});

test('an HEI needs a region', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload([
            'survey_region_id' => null,
        ]))
        ->assertSessionHasErrors('survey_region_id');

    expect(SurveyHei::query()->count())->toBe(0);
});

test('an HEI can be edited, and keeps its cluster while its region stays', function () {
    $hei = SurveyHei::query()->create(['survey_cluster_id' => $this->cluster->id, 'uii' => '12001', 'name' => 'Notre Dame of Marbel University', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->put(route('settings.survey-directories.update', ['type' => 'heis', 'id' => $hei->id]), [
            'uii' => '12001-A',
            'name' => 'Notre Dame University',
            'ownership' => 'public',
            'survey_region_id' => $this->cluster->survey_region_id,
            'is_active' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $hei->refresh();

    expect($hei->uii)->toBe('12001-A')
        ->and($hei->name)->toBe('Notre Dame University')
        ->and($hei->ownership)->toBe('public')
        ->and($hei->survey_cluster_id)->toBe($this->cluster->id);
});

test('an HEI moved to another region is filed there', function () {
    $hei = SurveyHei::query()->create(['survey_cluster_id' => $this->cluster->id, 'name' => 'Moving College', 'is_active' => true]);
    $elsewhere = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->put(route('settings.survey-directories.update', ['type' => 'heis', 'id' => $hei->id]), [
            'name' => 'Moving College',
            'survey_region_id' => $elsewhere->id,
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($hei->refresh()->cluster->survey_region_id)->toBe($elsewhere->id);
});

test('editing an HEI keeps its own UII without tripping the unique rule', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());
    $hei = SurveyHei::query()->sole();

    $this->actingAs($this->admin)
        ->put(route('settings.survey-directories.update', ['type' => 'heis', 'id' => $hei->id]), [
            ...heiPayload(['name' => 'Renamed Only']),
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($hei->refresh()->name)->toBe('Renamed Only');
});

test('an HEI can be deactivated so it leaves the public dropdown', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());
    $hei = SurveyHei::query()->sole();

    $this->actingAs($this->admin)
        ->put(route('settings.survey-directories.update', ['type' => 'heis', 'id' => $hei->id]), [
            ...heiPayload(),
            'is_active' => false,
        ])
        ->assertSessionHasNoErrors();

    expect($hei->refresh()->is_active)->toBeFalse();
});

test('an HEI with responses cannot be deleted', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());
    $hei = SurveyHei::query()->sole();
    $draft = Survey::query()->where('slug', 'ra-7877')->sole()->draftVersion();
    $draft->update(['retention_days' => 365, 'status' => 'published', 'published_at' => now()]);
    SurveyResponse::query()->create([
        'survey_version_id' => $draft->id, 'public_reference' => 'RA7877-LOCKED001',
        'age' => 20, 'sex' => 'female', 'respondent_group' => 'student',
        'survey_region_id' => SurveyRegion::query()->sole()->id,
        'survey_cluster_id' => $this->cluster->id, 'survey_hei_id' => $hei->id,
        'answers' => ['experiences' => ['none']], 'consent_at' => now(),
        'expires_at' => now()->addDays(365),
    ]);

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'heis', 'id' => $hei->id]))
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');

    expect(SurveyHei::query()->whereKey($hei->id)->exists())->toBeTrue();
});

test('an unused HEI can be deleted', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());
    $hei = SurveyHei::query()->sole();

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'heis', 'id' => $hei->id]))
        ->assertSessionHasNoErrors();

    expect(SurveyHei::query()->count())->toBe(0);
});

test('the directory page ships the columns the HEI table renders', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());

    $this->actingAs($this->admin)->get(route('settings.heis.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/heis')
            // The list is paged, so the rows sit under `data`.
            ->has('heis.data', 1)
            ->where('heis.total', 1)
            ->where('heis.per_page', 10)
            ->where('heis.data.0.uii', '12001')
            ->where('heis.data.0.name', 'Notre Dame of Marbel University')
            ->where('heis.data.0.ownership', 'private')
            ->where('heis.data.0.is_active', true)
            ->where('heis.data.0.region.name', 'Regional Office XII')
            // The cluster linking it to the region stays out of sight.
            ->missing('heis.data.0.cluster')
            ->missing('heis.data.0.survey_cluster_id'));
});

test('regions can be added, and clusters no longer can', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'regions']), ['name' => 'Region XI'])
        ->assertSessionHasNoErrors();

    $region = SurveyRegion::query()->where('name', 'Region XI')->sole();

    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'clusters']), [
            'name' => 'Davao del Sur',
            'survey_region_id' => $region->id,
        ])
        ->assertNotFound();
    $this->actingAs($this->admin)->get('/settings/clusters')->assertNotFound();
});

test('a region with no institutions is deleted with its empty clusters', function () {
    $region = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    SurveyCluster::query()->create(['survey_region_id' => $region->id, 'name' => 'Davao', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'regions', 'id' => $region->id]))
        ->assertSessionHas('inertia.flash_data.toast.type', 'deleted');

    expect(SurveyRegion::query()->whereKey($region->id)->exists())->toBeFalse()
        ->and(SurveyCluster::query()->where('survey_region_id', $region->id)->exists())->toBeFalse();
});

test('a region with institutions cannot be deleted', function () {
    SurveyHei::query()->create(['survey_cluster_id' => $this->cluster->id, 'name' => 'Placed College', 'is_active' => true]);

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'regions', 'id' => $this->cluster->survey_region_id]))
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');

    expect(SurveyRegion::query()->whereKey($this->cluster->survey_region_id)->exists())->toBeTrue();
});

test('a hand-entered HEI reaches the published public survey', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $survey->draftVersion()->update(['retention_days' => 365]);
    $this->actingAs($this->admin)->post(route('admin.surveys.publish', $survey))
        ->assertSessionHasNoErrors();

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('directories.heis.0.name', 'Notre Dame of Marbel University'));
});

test('the directory filters by name or UII, region, status and ownership', function () {
    $unassigned = SurveyCluster::query()->create(['survey_region_id' => $this->cluster->survey_region_id, 'name' => SurveyCluster::UNASSIGNED, 'is_active' => true]);
    SurveyHei::query()->create(['survey_cluster_id' => $unassigned->id, 'uii' => '12001', 'name' => 'Marbel College', 'ownership' => 'private', 'is_active' => true]);
    SurveyHei::query()->create(['survey_cluster_id' => $unassigned->id, 'uii' => '12002', 'name' => 'Koronadal State College', 'ownership' => 'public', 'is_active' => false]);
    SurveyHei::query()->create(['survey_cluster_id' => $unassigned->id, 'uii' => '12003', 'name' => 'Unlisted Owner College', 'is_active' => true]);
    $xi = SurveyRegion::query()->create(['name' => 'Regional Office XI']);
    $davao = SurveyCluster::query()->create(['survey_region_id' => $xi->id, 'name' => 'Davao', 'is_active' => true]);
    SurveyHei::query()->create(['survey_cluster_id' => $davao->id, 'uii' => '11001', 'name' => 'Davao College', 'is_active' => true]);
    $names = fn (array $query): array => collect($this->actingAs($this->admin)
        ->get(route('settings.heis.index', $query))
        ->assertOk()
        ->viewData('page')['props']['heis']['data'])->pluck('name')->all();

    expect($names(['search' => 'marbel']))->toBe(['Marbel College'])
        ->and($names(['search' => '12002']))->toBe(['Koronadal State College'])
        ->and($names(['region' => $xi->id]))->toBe(['Davao College'])
        ->and($names(['status' => 'inactive']))->toBe(['Koronadal State College'])
        ->and($names(['ownership' => 'public']))->toBe(['Koronadal State College'])
        ->and($names(['ownership' => 'none', 'region' => $this->cluster->survey_region_id]))->toBe(['Unlisted Owner College']);

    $this->get(route('settings.heis.index', ['status' => 'closed']))->assertSessionHasErrors('status');
});

test('the HEI directory never offers clusters', function () {
    $regionId = $this->cluster->survey_region_id;
    SurveyHei::query()->create(['survey_cluster_id' => SurveyCluster::holdingFor($regionId)->id, 'name' => 'Waiting College', 'is_active' => true]);
    SurveyHei::query()->create(['survey_cluster_id' => $this->cluster->id, 'name' => 'Placed College', 'is_active' => true]);

    $this->actingAs($this->admin)->get(route('settings.heis.index', ['region' => $regionId]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('heis.data', 2)
            ->missing('clusters')
            ->missing('clusterOptions')
            ->missing('clusterRegions')
            ->missing('filters.cluster'));
});
