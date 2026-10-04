<?php

use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

test('make:admin creates a verified Central Office administrator', function () {
    $this->artisan('make:admin')
        ->expectsQuestion('Name', 'Ana Dela Cruz')
        ->expectsQuestion('Email', 'ana@ched.gov.ph')
        ->expectsQuestion('Password', 'a-long-password')
        ->expectsQuestion('Confirm the password', 'a-long-password')
        ->assertSuccessful();

    $admin = User::query()->where('email', 'ana@ched.gov.ph')->sole();
    expect($admin->hasRole('admin'))->toBeTrue()
        ->and($admin->national_access)->toBeTrue()
        ->and($admin->email_verified_at)->not->toBeNull()
        ->and(Hash::check('a-long-password', $admin->password))->toBeTrue();
});

test('make:admin creates nothing when the passwords differ', function () {
    $this->artisan('make:admin')
        ->expectsQuestion('Name', 'Ana Dela Cruz')
        ->expectsQuestion('Email', 'ana@ched.gov.ph')
        ->expectsQuestion('Password', 'a-long-password')
        ->expectsQuestion('Confirm the password', 'another-password')
        ->assertFailed();

    expect(User::query()->count())->toBe(0);
});
