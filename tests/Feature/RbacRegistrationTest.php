<?php

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;

test('newly registered users receive the HEI role when RBAC is seeded', function () {
    $this->seed(RbacSeeder::class);

    $this->post(route('register.store'), [
        'name' => 'HEI User',
        'email' => 'hei@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect(route('dashboard'));

    $user = User::query()->where('email', 'hei@example.com')->sole();

    expect($user->hasRole('hei'))->toBeTrue()
        ->and(Role::query()->where('slug', 'hei')->exists())->toBeTrue();
});
