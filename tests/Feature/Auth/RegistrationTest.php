<?php

use App\Enums\UserStatus;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register and wait for approval', function () {
    Notification::fake();
    $hei = createSurveyHei();

    $response = $this->post(route('register.store'), registrationPayload($hei));

    $this->assertGuest();
    $response->assertRedirect(route('login', absolute: false));
    $response->assertSessionHas('status');

    $user = User::where('email', 'test@example.com')->firstOrFail();
    expect($user->status)->toBe(UserStatus::Pending)
        ->and($user->survey_hei_id)->toBe($hei->id)
        // Contact details wait for the Profile page.
        ->and($user->mobile_number)->toBeNull()
        ->and($user->sex)->toBeNull();
    Notification::assertNotSentTo($user, VerifyEmail::class);
});

test('registration ignores contact details, which belong on the Profile page', function () {
    $this->post(route('register.store'), registrationPayload(createSurveyHei(), [
        'mobile_number' => 'not a number',
        'sex' => 'other',
    ]))->assertSessionHasNoErrors();

    $user = User::query()->sole();
    expect($user->mobile_number)->toBeNull()
        ->and($user->sex)->toBeNull();
});

test('a region open for on-the-spot registration lets its HEIs straight in', function () {
    $this->seed(RbacSeeder::class);
    $hei = createSurveyHei();
    $hei->cluster->region->update(['instant_registration' => true, 'instant_registration_until' => now()->addHours(3)]);

    $this->post(route('register.store'), registrationPayload($hei))
        ->assertRedirect(route('dashboard', absolute: false))
        ->assertSessionHasNoErrors();

    $user = User::where('email', 'test@example.com')->firstOrFail();
    $this->assertAuthenticatedAs($user);
    expect($user->status)->toBe(UserStatus::Active)
        ->and($user->hasRole('hei'))->toBeTrue()
        ->and($user->hasRole('hei-focal'))->toBeFalse();
});

test('a closed, lapsed or other region still needs approval', function (Closure $setUp) {
    $hei = createSurveyHei();
    $setUp($hei);

    $this->post(route('register.store'), registrationPayload($hei))
        ->assertRedirect(route('login', absolute: false));

    $this->assertGuest();
    expect(User::where('email', 'test@example.com')->firstOrFail()->status)->toBe(UserStatus::Pending);
})->with([
    'closed' => fn () => fn (SurveyHei $hei) => null,
    'past its closing time' => fn () => fn (SurveyHei $hei) => $hei->cluster->region->update([
        'instant_registration' => true,
        'instant_registration_until' => now()->subMinute(),
    ]),
    'another region open' => fn () => fn (SurveyHei $hei) => SurveyRegion::query()->create([
        'name' => 'Regional Office XI',
        'instant_registration' => true,
    ]),
]);

test('the registration form lists every active region, and says which register on the spot', function () {
    $closed = createSurveyHei(['name' => 'Closed Region College']);
    $closed->cluster->region->update(['office_email' => 'chedro12@ched.gov.ph']);
    $openRegion = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'instant_registration' => true]);
    $cluster = SurveyCluster::query()->create(['survey_region_id' => $openRegion->id, 'name' => 'Davao', 'is_active' => true]);
    $open = SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => 'Open Region College', 'is_active' => true]);
    // Listed before its institutions arrive from the CHED directory.
    $empty = SurveyRegion::query()->create(['name' => 'Regional Office CAR']);
    SurveyRegion::query()->create(['name' => 'Regional Office NIR', 'is_active' => false]);

    $this->get(route('register'))->assertInertia(fn (Assert $page) => $page
        ->component('auth/register')
        ->has('regions', 3)
        ->where('regions.0', ['id' => $empty->id, 'name' => 'Regional Office CAR', 'instant' => false, 'email' => null])
        ->where('regions.1', ['id' => $openRegion->id, 'name' => 'Regional Office XI', 'instant' => true, 'email' => null])
        ->where('regions.2', [
            'id' => $closed->cluster->survey_region_id,
            'name' => 'Regional Office XII',
            'instant' => false,
            'email' => 'chedro12@ched.gov.ph',
        ])
        ->where('heis.0', ['id' => $closed->id, 'name' => 'Closed Region College', 'region_id' => $closed->cluster->survey_region_id])
        ->where('heis.1', ['id' => $open->id, 'name' => 'Open Region College', 'region_id' => $openRegion->id]));
});
