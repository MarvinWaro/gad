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
        'survey_cluster_id' => test()->cluster->id,
    ], ...$overrides];
}

test('an HEI is created with its UII, region, cluster, and ownership', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $hei = SurveyHei::query()->where('uii', '12001')->sole();

    expect($hei->name)->toBe('Notre Dame of Marbel University')
        ->and($hei->ownership)->toBe('private')
        ->and($hei->is_active)->toBeTrue()
        ->and($hei->cluster->name)->toBe('South Cotabato')
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

test('an HEI must belong to an existing cluster', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload([
            'survey_cluster_id' => 9999,
        ]))
        ->assertSessionHasErrors('survey_cluster_id');
});

test('an HEI can be edited, including moving it to another cluster', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'heis']), heiPayload());
    $hei = SurveyHei::query()->sole();
    $sarangani = SurveyCluster::query()->where('name', 'Sarangani')->sole();

    $this->actingAs($this->admin)
        ->put(route('settings.survey-directories.update', ['type' => 'heis', 'id' => $hei->id]), [
            'uii' => '12001-A',
            'name' => 'Notre Dame University',
            'ownership' => 'public',
            'survey_cluster_id' => $sarangani->id,
            'is_active' => true,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $hei->refresh();

    expect($hei->uii)->toBe('12001-A')
        ->and($hei->name)->toBe('Notre Dame University')
        ->and($hei->ownership)->toBe('public')
        ->and($hei->survey_cluster_id)->toBe($sarangani->id);
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
            ->where('heis.data.0.cluster.name', 'South Cotabato')
            ->where('heis.data.0.cluster.region.name', 'Regional Office XII'));
});

test('creating regions and clusters is unchanged by the HEI fields', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'regions']), ['name' => 'Region XI'])
        ->assertSessionHasNoErrors();

    $region = SurveyRegion::query()->where('name', 'Region XI')->sole();

    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'clusters']), [
            'name' => 'Davao del Sur',
            'survey_region_id' => $region->id,
        ])
        ->assertSessionHasNoErrors();

    expect(SurveyCluster::query()->where('name', 'Davao del Sur')->sole()->survey_region_id)
        ->toBe($region->id);
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
