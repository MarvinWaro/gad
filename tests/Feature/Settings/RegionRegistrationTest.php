<?php

use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->travelTo('2026-10-01 01:00:00');
    $this->seed(RbacSeeder::class);
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII']);
    $this->elsewhere = SurveyRegion::query()->create(['name' => 'Regional Office XI']);
});

function registrationManager(?SurveyRegion $region = null, bool $national = false, string $role = 'admin'): User
{
    $factory = User::factory();
    $factory = $national ? $factory->nationalOffice() : ($region ? $factory->regionalOffice($region) : $factory);
    $manager = $factory->create();
    $manager->assignRole($role);

    return $manager;
}

test('a regional user manager opens and closes on-the-spot registration for their region', function () {
    $this->actingAs(registrationManager($this->region));

    // Until 5 PM in the Philippines, which is 9 AM UTC.
    $this->put(route('settings.regions.registration', $this->region), ['open' => true, 'until' => '2026-10-01T17:00:00+08:00'])
        ->assertSessionHasNoErrors()
        ->assertInertiaFlash('toast.message', 'Regional Office XII: new accounts need no approval until Oct 1, 5:00 PM.');
    $region = $this->region->fresh();
    expect($region->instant_registration)->toBeTrue()
        ->and($region->instant_registration_until->toIso8601String())->toBe('2026-10-01T09:00:00+00:00')
        ->and($region->isOpenForInstantRegistration())->toBeTrue();

    $this->put(route('settings.regions.registration', $this->region), ['open' => true])->assertSessionHasNoErrors();
    expect($this->region->fresh()->instant_registration_until)->toBeNull();

    $this->put(route('settings.regions.registration', $this->region), ['open' => false])->assertSessionHasNoErrors();
    expect($this->region->fresh()->isOpenForInstantRegistration())->toBeFalse();

    // Another office's region is out of reach.
    $this->put(route('settings.regions.registration', $this->elsewhere), ['open' => true])->assertForbidden();
    expect($this->elsewhere->fresh()->instant_registration)->toBeFalse();
});

test('the Central Office switches any region, and the closing time must be ahead', function () {
    $this->actingAs(registrationManager(national: true));

    $this->put(route('settings.regions.registration', $this->elsewhere), ['open' => true])->assertSessionHasNoErrors();
    expect($this->elsewhere->fresh()->instant_registration)->toBeTrue();

    $this->put(route('settings.regions.registration', $this->region), ['open' => true, 'until' => '2026-10-01T08:00:00+08:00'])
        ->assertSessionHasErrors('until');
    expect($this->region->fresh()->instant_registration)->toBeFalse();
});

test('only user managers switch registration', function () {
    foreach ([registrationManager($this->region, role: 'ched-focal'), registrationManager($this->region, role: 'hei')] as $user) {
        $this->actingAs($user)->put(route('settings.regions.registration', $this->region), ['open' => true])->assertForbidden();
    }

    expect($this->region->fresh()->instant_registration)->toBeFalse();
});

test('the users page shows registration for the regions the manager covers', function () {
    $this->region->update(['instant_registration' => true, 'instant_registration_until' => now()->addHours(2)]);
    // Past its closing time, so it reads as needing approval.
    $this->elsewhere->update(['instant_registration' => true, 'instant_registration_until' => now()->subMinute()]);

    $this->actingAs(registrationManager($this->region))->get(route('settings.users.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('registration', 1)
            ->where('registration.0.name', 'Regional Office XII')
            ->where('registration.0.open', true)
            ->where('registration.0.until', '2026-10-01T03:00:00+00:00'));

    $this->actingAs(registrationManager(national: true))->get(route('settings.users.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('registration', 2)
            ->where('registration.0.name', 'Regional Office XI')
            ->where('registration.0.open', false)
            ->where('registration.0.until', null));

    $this->actingAs(registrationManager())->get(route('settings.users.index'))
        ->assertInertia(fn (Assert $page) => $page->has('registration', 0));
});
