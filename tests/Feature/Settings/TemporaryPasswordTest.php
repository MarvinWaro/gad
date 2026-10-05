<?php

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->nationalOffice()->create();
    $this->admin->assignRole('admin');
    $this->hei = createSurveyHei();
    $this->heiRole = Role::query()->where('slug', 'hei')->sole();
});

/** @param  array<string, mixed>  $overrides */
function temporaryPasswordPayload(User|array $user, array $overrides = []): array
{
    return [
        'name' => $user instanceof User ? $user->name : 'New Member',
        'email' => $user instanceof User ? $user->email : 'new-member@example.test',
        'password' => '',
        'password_confirmation' => '',
        'role_ids' => [Role::query()->where('slug', 'hei')->value('id')],
        'survey_hei_id' => test()->hei->id,
        ...$overrides,
    ];
}

test('an account created in Settings → Users starts with the temporary password', function () {
    $this->actingAs($this->admin)->get(route('settings.users.index'))
        ->assertInertia(fn (Assert $page) => $page->where('temporaryPassword', 'password'));

    $this->post(route('settings.users.store'), temporaryPasswordPayload([]))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('settings.users.index'))
        ->assertSessionHas('inertia.flash_data.toast.message', 'User created. Their temporary password is “password”.');

    $user = User::query()->where('email', 'new-member@example.test')->sole();
    expect(Hash::check('password', $user->password))->toBeTrue()
        ->and($user->must_change_password)->toBeTrue();
});

test('until it chooses its own password, the account opens nothing else', function () {
    $user = User::factory()->mustChangePassword()->create(['survey_hei_id' => $this->hei->id]);
    $user->assignRole('hei');

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('password.change'));
    $this->get(route('profile.edit'))->assertRedirect(route('password.change'));
    $this->getJson(route('notifications.summary'))->assertForbidden();
    $this->get(route('password.change'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('auth/change-password')->has('passwordRules'));

    $this->post(route('logout'))->assertRedirect();
    $this->assertGuest();
});

test('the new password must differ from the temporary one, then the account goes where it was headed', function () {
    $user = User::factory()->mustChangePassword()->create(['survey_hei_id' => $this->hei->id]);
    $user->assignRole('hei');
    $this->actingAs($user)->get(route('profile.edit'));

    $this->from(route('password.change'))->put(route('password.change.update'), ['password' => 'password', 'password_confirmation' => 'password'])
        ->assertSessionHasErrors(['password' => 'Choose a password different from the temporary one.']);
    $this->put(route('password.change.update'), ['password' => 'my-own-password', 'password_confirmation' => 'another-password'])
        ->assertSessionHasErrors('password');

    $this->put(route('password.change.update'), ['password' => 'my-own-password', 'password_confirmation' => 'my-own-password'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();
    expect($user->must_change_password)->toBeFalse()
        ->and(Hash::check('my-own-password', $user->password))->toBeTrue()
        ->and(ActivityLog::query()->where('user_id', $user->id)->where('action', ActivityAction::PasswordChanged)->exists())->toBeTrue();
    $this->get(route('dashboard'))->assertOk();
});

test('an account with its own password never uses the temporary-password page', function () {
    $user = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $user->assignRole('hei');

    $this->actingAs($user)->get(route('dashboard'))->assertOk();
    $this->get(route('password.change'))->assertRedirect(route('dashboard'));
    $this->put(route('password.change.update'), ['password' => 'taken-over', 'password_confirmation' => 'taken-over'])
        ->assertForbidden();

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

test('a password an administrator sets for someone else is theirs to replace at next sign-in', function () {
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');

    $this->actingAs($this->admin)
        ->put(route('settings.users.update', $member), temporaryPasswordPayload($member))
        ->assertSessionHasNoErrors();
    expect($member->fresh()->must_change_password)->toBeFalse();

    $this->put(route('settings.users.update', $member), temporaryPasswordPayload($member, [
        'password' => 'handed-over',
        'password_confirmation' => 'handed-over',
    ]))->assertSessionHasNoErrors();
    expect($member->fresh()->must_change_password)->toBeTrue()
        ->and(Hash::check('handed-over', $member->fresh()->password))->toBeTrue();

    // Saving the account again without a password keeps it waiting.
    $this->put(route('settings.users.update', $member), temporaryPasswordPayload($member))->assertSessionHasNoErrors();
    expect($member->fresh()->must_change_password)->toBeTrue();
});

test('an administrator setting their own password keeps it', function () {
    $this->actingAs($this->admin)
        ->put(route('settings.users.update', $this->admin), [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'password' => 'my-new-password',
            'password_confirmation' => 'my-new-password',
            'role_ids' => [Role::query()->where('slug', 'admin')->value('id')],
        ])
        ->assertSessionHasNoErrors();

    expect($this->admin->fresh()->must_change_password)->toBeFalse()
        ->and(Hash::check('my-new-password', $this->admin->fresh()->password))->toBeTrue();
});

test('a forgotten-password reset also replaces a temporary password', function () {
    $user = User::factory()->mustChangePassword()->create();

    $this->post(route('password.update'), [
        'token' => Password::createToken($user),
        'email' => $user->email,
        'password' => 'chosen-by-me',
        'password_confirmation' => 'chosen-by-me',
    ])->assertSessionHasNoErrors();

    expect($user->fresh()->must_change_password)->toBeFalse();
});
