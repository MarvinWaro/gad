<?php

use App\Models\ActivityLog;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Carbon\CarbonInterface;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->nationalOffice()->create(['name' => 'Central Admin']);
    $this->admin->assignRole('admin');

    $this->xiiHei = createSurveyHei(['name' => 'Twelve College']);
    $xi = SurveyRegion::query()->create(['name' => 'Regional Office XI']);
    $davao = SurveyCluster::query()->create(['survey_region_id' => $xi->id, 'name' => 'Davao', 'is_active' => true]);
    $this->xiHei = SurveyHei::query()->create(['survey_cluster_id' => $davao->id, 'name' => 'Eleven College', 'is_active' => true]);

    $member = function (string $name, SurveyHei $hei, ?CarbonInterface $seen): User {
        $user = User::factory()->create(['name' => $name, 'survey_hei_id' => $hei->id]);
        $user->assignRole('hei');
        $user->forceFill(['last_seen_at' => $seen])->save();

        return $user;
    };
    $this->here = $member('Here Now', $this->xiiHei, now()->subMinutes(2));
    $this->earlier = $member('Here Earlier', $this->xiiHei, now()->subHours(3));
    $member('Never Here', $this->xiiHei, null);
    $member('Eleven Here', $this->xiHei, now()->subMinute());
});

test('a signed-in visit notes when the person was last here, at most once a minute, quietly', function () {
    $user = User::factory()->create();
    $updatedAt = $user->updated_at;

    $this->travelTo(now()->addHour());
    $this->actingAs($user)->get(route('profile.edit'))->assertOk();
    $seen = $user->fresh()->last_seen_at;
    expect($seen?->timestamp)->toBe(now()->timestamp)
        // Straight to the column: no updated_at, no activity log entry.
        ->and($user->fresh()->updated_at->timestamp)->toBe($updatedAt->timestamp)
        ->and(ActivityLog::query()->where('user_id', $user->id)->exists())->toBeFalse();

    // Within the minute, a visit writes nothing.
    $this->travel(30)->seconds();
    $user->refresh();
    DB::enableQueryLog();
    $this->get(route('profile.edit'))->assertOk();
    expect(collect(DB::getQueryLog())->pluck('query')->filter(fn (string $sql) => str_contains($sql, 'last_seen_at'))->all())->toBe([])
        ->and($user->fresh()->last_seen_at->timestamp)->toBe($seen->timestamp);

    // A minute on, it moves.
    $this->travel(31)->seconds();
    $user->refresh();
    $this->get(route('profile.edit'))->assertOk();
    expect($user->fresh()->last_seen_at->timestamp)->toBe(now()->timestamp);
});

test('guests leave nothing behind', function () {
    $this->get('/')->assertOk();

    expect(User::query()->whereNotNull('last_seen_at')->count())->toBe(3);
});

test('the users list shows who is online, when the others were last here, and counts the online ones', function () {
    $this->actingAs($this->admin)->get(route('settings.users.index', ['role' => 'hei']))
        ->assertInertia(function (Assert $page) {
            $page->where('onlineCount', 2)->where('filters.online', '');
            $users = collect($page->toArray()['props']['users']['data'])->keyBy('name');

            expect($users['Here Now']['online'])->toBeTrue()
                ->and($users['Eleven Here']['online'])->toBeTrue()
                ->and($users['Here Earlier']['online'])->toBeFalse()
                ->and($users['Here Earlier']['last_seen_at'])->toBe($this->earlier->fresh()->last_seen_at->toISOString())
                ->and($users['Never Here']['online'])->toBeFalse()
                ->and($users['Never Here']['last_seen_at'])->toBeNull();
        });
});

test('"Online now" lists only those online, within the other filters', function () {
    $this->actingAs($this->admin);

    $this->get(route('settings.users.index', ['online' => 1]))->assertInertia(fn (Assert $page) => $page
        ->where('filters.online', '1')
        // The status tabs count within it, as within the other filters.
        ->where('statusCounts', ['pending' => 0, 'active' => 2, 'inactive' => 0])
        ->where('users.data', fn ($users) => collect($users)->pluck('name')->sort()->values()->all() === ['Eleven Here', 'Here Now']));

    $this->get(route('settings.users.index', ['online' => 1, 'hei' => $this->xiiHei->id]))->assertInertia(fn (Assert $page) => $page
        ->where('onlineCount', 1)
        ->where('users.data', fn ($users) => collect($users)->pluck('name')->all() === ['Here Now']));

    $this->get(route('settings.users.index', ['online' => 'maybe']))->assertSessionHasErrors('online');
});

test('a CHED Focal sees who is online in their own region only', function () {
    $focal = User::factory()->create(['survey_region_id' => $this->xiiHei->cluster->survey_region_id]);
    $focal->assignRole('ched-focal');

    $this->actingAs($focal)->get(route('settings.users.index', ['online' => 1]))->assertInertia(fn (Assert $page) => $page
        ->where('onlineCount', 1)
        ->where('users.data', fn ($users) => collect($users)->pluck('name')->all() === ['Here Now']));
});

test('when someone was last here is kept from everyone but the users list', function () {
    $this->actingAs($this->here)->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page->missing('auth.user.last_seen_at'));

    expect($this->here->fresh()->toArray())->not->toHaveKey('last_seen_at');
});
