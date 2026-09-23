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
        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@gmail.com'],
            ['name' => 'Administrator', 'password' => '12345678'],
        );

        if ($admin->wasRecentlyCreated) {
            $admin->forceFill(['email_verified_at' => now()])->save();
        }

        $admin->assignRole('admin');
    }
}
