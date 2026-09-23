<?php

use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveyDirectorySeeder;
use Database\Seeders\SurveyRegionSeeder;
use Database\Seeders\SurveySeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});

test('every CHED regional office is seeded, in order', function () {
    $this->seed(SurveyRegionSeeder::class);

    // Canonical id order only holds when the offices are seeded first, which
    // DatabaseSeeder guarantees and DatabaseSeederTest asserts; here the survey
    // seeder already made one, so compare the set.
    expect(SurveyRegion::query()->count())->toBe(17)
        ->and(SurveyRegion::query()->pluck('name')->sort()->values()->all())
        ->toBe(collect(SurveyRegionSeeder::OFFICES)->sort()->values()->all())
        ->and(SurveyRegion::query()->where('is_active', false)->count())->toBe(0);
});

test('the older "Region XII" row is renamed rather than duplicated', function () {
    // Keeps the clusters and HEIs already hanging off it attached.
    $legacy = SurveyRegion::query()->where('name', 'Regional Office XII')->sole();
    $legacy->update(['name' => 'Region XII']);
    $cluster = SurveyCluster::query()->create([
        'survey_region_id' => $legacy->id, 'name' => 'South Cotabato', 'is_active' => true,
    ]);
    SurveyHei::query()->create([
        'survey_cluster_id' => $cluster->id, 'name' => 'Kept HEI', 'is_active' => true,
    ]);

    $this->seed(SurveyRegionSeeder::class);

    expect(SurveyRegion::query()->count())->toBe(17)
        ->and(SurveyRegion::query()->where('name', 'Region XII')->exists())->toBeFalse()
        ->and($legacy->refresh()->name)->toBe('Regional Office XII')
        ->and($cluster->refresh()->survey_region_id)->toBe($legacy->id)
        ->and(SurveyHei::query()->sole()->cluster->region->name)->toBe('Regional Office XII');
});

test('re-seeding the offices adds nothing and renames nothing', function () {
    $this->seed(SurveyRegionSeeder::class);
    $this->seed(SurveyRegionSeeder::class);

    expect(SurveyRegion::query()->count())->toBe(17);
});

test('the HEI page shows ten institutions per page', function () {
    $this->seed(SurveyDirectorySeeder::class);
    $cluster = SurveyCluster::query()->where('name', 'South Cotabato')->sole();
    foreach (range(1, 23) as $index) {
        SurveyHei::query()->create([
            'survey_cluster_id' => $cluster->id,
            'name' => sprintf('Institution %02d', $index),
            'is_active' => true,
        ]);
    }

    $this->actingAs($this->admin)->get(route('settings.heis.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/heis')
            ->has('heis.data', 10)
            ->where('heis.total', 23)
            ->where('heis.per_page', 10)
            ->where('heis.current_page', 1)
            ->where('heis.last_page', 3)
            ->where('heis.data.0.name', 'Institution 01'));
});

test('a later page continues the same ordering', function () {
    $this->seed(SurveyDirectorySeeder::class);
    $cluster = SurveyCluster::query()->where('name', 'South Cotabato')->sole();
    foreach (range(1, 23) as $index) {
        SurveyHei::query()->create([
            'survey_cluster_id' => $cluster->id,
            'name' => sprintf('Institution %02d', $index),
            'is_active' => true,
        ]);
    }

    $this->actingAs($this->admin)->get(route('settings.heis.index', ['page' => 3]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('heis.data', 3)
            ->where('heis.current_page', 3)
            ->where('heis.data.0.name', 'Institution 21'));
});

test('the other directory pages are not paged', function () {
    $this->seed(SurveyDirectorySeeder::class);

    $this->actingAs($this->admin)->get(route('settings.regions.index'))
        ->assertInertia(fn (Assert $page) => $page->has('regions', 1));
    $this->actingAs($this->admin)->get(route('settings.clusters.index'))
        ->assertInertia(fn (Assert $page) => $page->has('clusters', 4));
});
