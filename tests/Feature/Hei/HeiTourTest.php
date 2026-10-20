<?php

use App\Models\ActivityLog;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

function heiTourMember(string $role = 'hei'): User
{
    $user = User::factory()->create(['survey_hei_id' => createSurveyHei()->id]);
    $user->assignRole($role);

    return $user;
}

test('the guided tour starts by itself on a new HEI account\'s home, until it is finished or closed', function (string $role) {
    $member = heiTourMember($role);
    $updatedAt = $member->updated_at;

    $this->travelTo(now()->addHour());
    $this->actingAs($member)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('hei/home')->where('tourPending', true));

    $this->postJson(route('tour.seen'))->assertNoContent();

    $member->refresh();
    expect($member->tour_seen_at?->timestamp)->toBe(now()->timestamp)
        // Straight to the column: no updated_at, no activity log entry.
        ->and($member->updated_at->timestamp)->toBe($updatedAt->timestamp)
        ->and(ActivityLog::query()->where('user_id', $member->id)->exists())->toBeFalse();
    $this->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('tourPending', false));
})->with(['hei', 'hei-focal']);

test('when the tour was seen is kept from the page props', function () {
    $member = heiTourMember();
    $member->markTourSeen();

    $this->actingAs($member)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->missing('auth.user.tour_seen_at'));
    expect($member->fresh()->toArray())->not->toHaveKey('tour_seen_at');
});

test('staff dashboards have no tour, and noting it needs a signed-in account', function () {
    $admin = User::factory()->nationalOffice()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('dashboard')->missing('tourPending'));

    auth()->logout();
    $this->postJson(route('tour.seen'))->assertUnauthorized();
});
