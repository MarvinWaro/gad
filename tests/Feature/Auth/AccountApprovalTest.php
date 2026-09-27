<?php

use App\Enums\UserStatus;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('pending accounts cannot log in', function () {
    $user = User::factory()->pending()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertSessionHasErrors([
        'email' => UserStatus::Pending->loginMessage(),
    ]);

    $this->assertGuest();
});

test('inactive accounts cannot log in', function () {
    $user = User::factory()->inactive()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertSessionHasErrors([
        'email' => UserStatus::Inactive->loginMessage(),
    ]);

    $this->assertGuest();
});

test('a wrong password does not reveal the account status', function () {
    $user = User::factory()->pending()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertSessionHasErrors(['email' => __('auth.failed')]);

    $this->assertGuest();
});

test('active accounts log in normally', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticatedAs($user);
});

test('an account deactivated during a session is signed out on its next request', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get(route('dashboard'))->assertOk();

    $user->update(['status' => UserStatus::Inactive]);

    $this->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors(['email' => UserStatus::Inactive->loginMessage()]);
    $this->assertGuest();
});

test('the register page lists only active institutions', function () {
    $active = createSurveyHei(['name' => 'Active College']);
    createSurveyHei(['name' => 'Closed College', 'is_active' => false]);

    $this->get(route('register'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/register')
            ->has('heis', 1)
            ->where('heis.0.id', $active->id)
            ->where('heis.0.name', 'Active College'));
});

test('registration requires an active institution', function () {
    $inactive = createSurveyHei(['is_active' => false]);

    $this->post(route('register.store'), registrationPayload($inactive))
        ->assertSessionHasErrors('survey_hei_id');

    $this->post(route('register.store'), [
        ...registrationPayload($inactive),
        'survey_hei_id' => '',
    ])->assertSessionHasErrors('survey_hei_id');

    expect(User::query()->count())->toBe(0);
});

test('registration validates the mobile number and sex', function (array $overrides, string $field) {
    $this->post(route('register.store'), registrationPayload(createSurveyHei(), $overrides))
        ->assertSessionHasErrors($field);

    expect(User::query()->count())->toBe(0);
})->with([
    'missing mobile' => [['mobile_number' => ''], 'mobile_number'],
    'landline' => [['mobile_number' => '083 552 1234'], 'mobile_number'],
    'too short' => [['mobile_number' => '0917123'], 'mobile_number'],
    'missing sex' => [['sex' => ''], 'sex'],
    'unknown sex' => [['sex' => 'other'], 'sex'],
]);

test('mobile numbers are stored in the 09XXXXXXXXX form', function (string $input) {
    $this->post(route('register.store'), registrationPayload(createSurveyHei(), [
        'mobile_number' => $input,
    ]))->assertSessionHasNoErrors();

    expect(User::query()->sole()->mobile_number)->toBe('09171234567');
})->with([
    '+63 917 123 4567',
    '639171234567',
    '9171234567',
    '0917-123-4567',
]);
