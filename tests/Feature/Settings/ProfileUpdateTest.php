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
        ->assertInertia(fn ($page) => $page->where('institution', null)->where('office', null));
});

test('the profile names the institution\'s own regional office, and shows the contact details', function () {
    $hei = createSurveyHei();
    $hei->cluster->region->update(['office_email' => 'chedro12@ched.gov.ph']);
    $user = User::factory()->create(['survey_hei_id' => $hei->id, 'mobile_number' => '09171234567', 'sex' => 'female']);

    $this->actingAs($user)->get(route('profile.edit'))->assertInertia(fn ($page) => $page
        ->where('office.name', 'Regional Office XII')
        ->where('office.email', 'chedro12@ched.gov.ph')
        ->where('details', ['mobile_number' => '09171234567', 'sex' => 'female']));
});

test('contact details are optional, and mobile numbers are stored in the 09XXXXXXXXX form', function (?string $input, ?string $stored) {
    $user = User::factory()->create();

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => $user->name,
        'email' => $user->email,
        'mobile_number' => $input,
        'sex' => 'male',
    ])->assertSessionHasNoErrors();

    expect($user->fresh()->mobile_number)->toBe($stored)
        ->and($user->fresh()->sex)->toBe('male');
})->with([
    '+63 917 123 4567' => ['+63 917 123 4567', '09171234567'],
    '639171234567' => ['639171234567', '09171234567'],
    '9171234567' => ['9171234567', '09171234567'],
    '0917-123-4567' => ['0917-123-4567', '09171234567'],
    'left blank' => ['', null],
]);

test('the profile refuses a landline, a short number or an unknown sex', function (array $details, string $field) {
    $user = User::factory()->create();

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => $user->name,
        'email' => $user->email,
        ...$details,
    ])->assertSessionHasErrors($field);
})->with([
    'landline' => [['mobile_number' => '083 552 1234'], 'mobile_number'],
    'too short' => [['mobile_number' => '0917123'], 'mobile_number'],
    'unknown sex' => [['sex' => 'other'], 'sex'],
]);

test('saving the name alone keeps the contact details', function () {
    $user = User::factory()->create(['mobile_number' => '09171234567', 'sex' => 'female']);

    $this->actingAs($user)->patch(route('profile.update'), [
        'name' => 'Renamed User',
        'email' => $user->email,
    ])->assertSessionHasNoErrors();

    expect($user->fresh())
        ->name->toBe('Renamed User')
        ->mobile_number->toBe('09171234567')
        ->sex->toBe('female');
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
