<?php

use App\Models\User;
use App\Support\InstitutionName;
use Database\Seeders\RbacSeeder;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('administrators can delete their own account', function () {
    $this->seed(RbacSeeder::class);
    $user = User::factory()->create();
    $user->assignRole('admin');

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $this->seed(RbacSeeder::class);
    $user = User::factory()->create();
    $user->assignRole('admin');

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});

test('the profile shows the institution, which only administrators can change', function () {
    $hei = createSurveyHei(['name' => 'STI COLLEGE KORONADAL CITY, INC.']);
    $other = createSurveyHei(['name' => 'Notre Dame of Marbel University']);
    $user = User::factory()->create(['survey_hei_id' => $hei->id]);

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page->where('institution', InstitutionName::display($hei->name)));

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'survey_hei_id' => $other->id,
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->survey_hei_id)->toBe($hei->id);
});

test('accounts without an institution show none', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page->where('institution', null));
});

test('only administrators may delete their own account', function (string $role) {
    $this->seed(RbacSeeder::class);
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertForbidden();

    expect($user->fresh())->not->toBeNull();
})->with(['hei', 'gad-focal-person']);
