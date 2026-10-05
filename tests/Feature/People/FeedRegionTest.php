<?php

use App\Models\Post;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Home HEI']);
    $this->region = $this->hei->cluster->region;
    $elsewhere = SurveyRegion::query()->create(['name' => 'Fictional Far Region', 'is_active' => true]);
    $this->farHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $elsewhere->id, 'name' => 'Far', 'is_active' => true])->id,
        'name' => 'Fictional Far HEI',
        'is_active' => true,
    ]);
    $this->reader = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $this->reader->assignRole('hei');

    $at = CarbonImmutable::parse('2026-10-01 08:00', 'UTC');
    $authors = [
        'Our HEI post' => User::factory()->create(['survey_hei_id' => $this->hei->id]),
        'Our CHED office post' => User::factory()->regionalOffice($this->region)->create(),
        'Far HEI post' => User::factory()->create(['survey_hei_id' => $this->farHei->id]),
        'Far CHED office post' => User::factory()->regionalOffice($elsewhere)->create(),
        'Central Office post' => User::factory()->nationalOffice()->create(),
    ];
    foreach (array_keys($authors) as $index => $body) {
        Post::query()->forceCreate([
            'user_id' => $authors[$body]->id,
            'survey_hei_id' => $authors[$body]->survey_hei_id,
            'body' => $body,
            'created_at' => $at->addMinutes($index),
            'updated_at' => $at->addMinutes($index),
        ]);
    }
});

test('My region shows the posts of the reader\'s region: its HEIs and its CHED office', function () {
    $this->actingAs($this->reader)->get(route('dashboard', ['feed' => 'region']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('feed', 'region')
            ->where('feedRegion.name', 'Regional Office XII')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('posts.data', fn ($posts) => collect($posts)->pluck('body')->all() === ['Our CHED office post', 'Our HEI post'])));

    $since = ['after' => strtolower((string) Str::ulid()), 'at' => '2026-09-30T00:00:00Z'];
    $this->getJson(route('posts.newer', $since))->assertJsonPath('count', 5);
    $this->getJson(route('posts.newer', [...$since, 'feed' => 'region']))->assertJsonPath('count', 2);
});

test('CHED staff read their office\'s region in Gender Mainstreaming', function () {
    $staff = User::factory()->regionalOffice($this->region)->create();
    $staff->assignRole('ched-focal');

    $this->actingAs($staff)->get(route('community', ['feed' => 'region']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('feedRegion.name', 'Regional Office XII')
            ->loadDeferredProps(fn (Assert $reload) => $reload->has('posts.data', 2)));
});

test('the Central Office has no My region, and asking for it shows every post', function () {
    $admin = User::factory()->nationalOffice()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get(route('community', ['feed' => 'region']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('feed', 'all')
            ->where('feedRegion', null)
            ->loadDeferredProps(fn (Assert $reload) => $reload->has('posts.data', 5)));
});
