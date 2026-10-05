<?php

use App\Models\User;
use Database\Seeders\RbacSeeder;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

test('each throttled route keeps its own count', function () {
    $member = User::factory()->create(['survey_hei_id' => createSurveyHei()->id]);
    $member->assignRole('hei');

    // Both allow 60 a minute; using one up leaves the other untouched.
    foreach (range(1, 60) as $poll) {
        $this->actingAs($member)->getJson(route('notifications.summary'))->assertOk();
    }
    $this->actingAs($member)->getJson(route('notifications.summary'))->assertTooManyRequests();
    $this->actingAs($member)->getJson(route('notifications.recent'))->assertOk();
});

test('visitors behind one address are counted apart, by their session', function () {
    foreach (range(1, 5) as $rating) {
        $this->post(route('ratings.store'), ['rating' => 5])->assertRedirect();
    }
    // Without a session cookie, the address is the visitor.
    $this->post(route('ratings.store'), ['rating' => 5])->assertTooManyRequests();

    // Another browser on the same Wi-Fi still gets through.
    $this->withCookie(config('session.cookie'), 'another-browser')
        ->post(route('ratings.store'), ['rating' => 4])
        ->assertRedirect();
});

test('signing up is limited per visitor too', function () {
    foreach (range(1, 10) as $attempt) {
        $this->post(route('register.store'), ['email' => "not-an-email-{$attempt}"]);
    }

    $this->post(route('register.store'), ['email' => 'not-an-email'])->assertTooManyRequests();
});
