<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $existing = User::query()->where('email', 'admin@gmail.com')->first();
        if ($existing !== null && ! $existing->hasRole('admin')) {
            throw new RuntimeException('admin@gmail.com already belongs to a non-admin user; resolve that account before seeding.');
        }

        // The model hashes passwords. Re-seeding must not reset a changed password.
        $admin = $existing ?? User::query()->create([
            'email' => 'admin@gmail.com',
            'name' => 'Administrator',
            'password' => $this->password(),
        ]);

        // The first administrator works for the Central Office, so they can
        // place every other staff account in its office.
        if ($admin->wasRecentlyCreated) {
            $admin->forceFill(['email_verified_at' => now(), 'national_access' => true])->save();
        }

        $admin->assignRole('admin');
    }

    /**
     * ADMIN_PASSWORD from .env. Only a local or test database falls back to
     * the shared development password.
     */
    private function password(): string
    {
        $password = config('app.admin_password');

        if (is_string($password) && $password !== '') {
            return $password;
        }

        if (app()->isProduction()) {
            throw new RuntimeException('Set ADMIN_PASSWORD in .env before seeding: the first administrator needs a password of its own.');
        }

        return '12345678';
    }
}
