<?php

use App\Enums\UserStatus;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
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
        // No clusters: the region's institutions list straight away.
        $page->missing('places.clusters')->where('places.heis.0.name', 'Eleven College');
    });
    $this->get(route('settings.users.index', ['region' => $this->xii->id]))
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

test('the form\'s institutions go out once, and the list runs no query per account', function () {
    $this->actingAs($this->admin);

    $page = fn () => $this->get(route('settings.users.index'));
    // Queries reading permissions while the list is built.
    $permissionQueries = function () use ($page): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $page()->assertOk();
        DB::disableQueryLog();

        return collect(DB::getQueryLog())->filter(fn (array $query): bool => str_contains($query['query'], 'from "permissions"'))->count();
    };

    $page()->assertInertia(fn (Assert $page) => $page
        // The signed-in account's own fields only, though the permission
        // checks loaded its roles; its permissions go out on their own.
        ->where('auth.user.name', 'Central Admin')
        ->missing('auth.user.roles')
        ->where('auth.permissions', fn ($permissions) => collect($permissions)->contains('users.view'))
        ->has('heis', 2)
        ->has('heiRegions', 2)
        ->where('users.data', fn ($users) => collect($users)->every(fn (array $user): bool => is_bool($user['can_manage']))));

    // Every listed account's roles and permissions arrive in one eager load,
    // so more accounts on the page mean no more queries.
    $before = $permissionQueries();
    User::factory()->count(4)->create()->each(fn (User $user) => $user->assignRole('hei'));
    expect($permissionQueries())->toBe($before);

    // Paging or filtering, the browser already holds them: they are not sent again.
    $this->get(route('settings.users.index', ['page' => 1]), [
        'X-Inertia' => 'true',
        'X-Requested-With' => 'XMLHttpRequest',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
        'X-Inertia-Except-Once-Props' => 'heis,heiRegions',
    ])
        ->assertOk()
        ->assertJsonMissingPath('props.heis')
        ->assertJsonMissingPath('props.heiRegions')
        ->assertJsonPath('props.users.data.0.name', 'Twelve Focal');
});
