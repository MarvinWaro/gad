<?php

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
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
        ->and($user->mobile_number)->toBe('09171234567')
        ->and($user->sex)->toBe('female');
    Notification::assertNotSentTo($user, VerifyEmail::class);
});
