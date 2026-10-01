<?php

use App\Enums\UserStatus;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->nationalOffice()->create(['name' => 'Central Admin']);
    $this->admin->assignRole('admin');

    $this->xiiHei = createSurveyHei(['name' => 'Twelve College']);
    $this->xii = $this->xiiHei->cluster->region;
    $this->xi = SurveyRegion::query()->create(['name' => 'Regional Office XI']);
    $this->davao = SurveyCluster::query()->create(['survey_region_id' => $this->xi->id, 'name' => 'Davao', 'is_active' => true]);
    $this->xiHei = SurveyHei::query()->create(['survey_cluster_id' => $this->davao->id, 'name' => 'Eleven College', 'is_active' => true]);

    $place = function (string $name, string $role, array $attributes = []): User {
        $user = User::factory()->create(['name' => $name, ...$attributes]);
        $user->assignRole($role);

        return $user;
    };
    $place('Twelve User', 'hei', ['survey_hei_id' => $this->xiiHei->id]);
    $place('Twelve Focal', 'hei-focal', ['survey_hei_id' => $this->xiiHei->id, 'status' => UserStatus::Pending]);
    $place('Eleven User', 'hei', ['survey_hei_id' => $this->xiHei->id]);
    $place('Eleven Staff', 'ched-focal', ['survey_region_id' => $this->xi->id]);
});

/** @return list<string> */
function listedUsers(Assert $page): array
{
    return collect($page->toArray()['props']['users']['data'])->pluck('name')->sort()->values()->all();
}

test('users filter by role, and the status tabs count within the filters', function () {
    $this->actingAs($this->admin)->get(route('settings.users.index', ['role' => 'hei-focal']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.role', 'hei-focal')
            ->where('statusCounts', ['pending' => 1, 'active' => 0, 'inactive' => 0])
            ->where('users.data', fn ($users) => collect($users)->pluck('name')->all() === ['Twelve Focal'])
            ->has('roleOptions', 6));

    // Without filters, every account counts.
    $this->get(route('settings.users.index'))->assertInertia(fn (Assert $page) => $page
        ->where('statusCounts', ['pending' => 1, 'active' => 4, 'inactive' => 0]));
});

test('users filter by where they are placed: their institution, or their regional office', function () {
    $this->actingAs($this->admin);

    // An HEI account through its institution's region; CHED staff through their office.
    $this->get(route('settings.users.index', ['region' => $this->xi->id]))->assertInertia(function (Assert $page) {
        expect(listedUsers($page))->toBe(['Eleven Staff', 'Eleven User']);
        // One cluster is no choice: the region's institutions list straight away.
        $page->has('places.clusters', 0)->where('places.heis.0.name', 'Eleven College');
    });
    $this->get(route('settings.users.index', ['region' => $this->xii->id, 'cluster' => $this->xiiHei->survey_cluster_id]))
        ->assertInertia(function (Assert $page) {
            expect(listedUsers($page))->toBe(['Twelve Focal', 'Twelve User']);
            $page->has('places.heis', 1)->where('places.heis.0.name', 'Twelve College');
        });
    $this->get(route('settings.users.index', ['hei' => $this->xiHei->id]))
        ->assertInertia(fn (Assert $page) => expect(listedUsers($page))->toBe(['Eleven User']));
    // The Central Office picks among every region.
    $this->get(route('settings.users.index'))->assertInertia(fn (Assert $page) => $page->has('places.regions', 2));
});

test('an unknown role or place is refused', function () {
    $this->actingAs($this->admin)->get(route('settings.users.index', ['role' => 'no-such-role']))
        ->assertSessionHasErrors('role');
    $this->get(route('settings.users.index', ['region' => 99999]))->assertSessionHasErrors('region');
});
