<?php

namespace App\Console\Commands;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Creates an administrator from the command line, for a new server or when
 * nobody can sign in: a Central Office account, verified and active. The
 * password is typed, never kept in .env or the code.
 */
class MakeAdmin extends Command
{
    protected $signature = 'make:admin';

    protected $description = 'Create an administrator account (Central Office, every permission)';

    public function handle(ActivityRecorder $activity): int
    {
        if (! Role::query()->where('slug', 'admin')->exists()) {
            $this->error('The Administrator role does not exist yet. Run php artisan db:seed --class=RbacSeeder first.');

            return self::FAILURE;
        }

        $name = text('Name', required: true, validate: ['name' => ['required', 'string', 'max:255']]);
        $email = text('Email', required: true, validate: ['email' => ['required', 'email', 'max:255', 'unique:users,email']]);
        $password = password('Password', required: true, validate: ['password' => ['required', Password::defaults()]]);
        $confirmation = password('Confirm the password', required: true);

        if (! Validator::make(['password' => $password, 'password_confirmation' => $confirmation], ['password' => ['confirmed']])->passes()) {
            $this->error('The passwords do not match. Nothing was created.');

            return self::FAILURE;
        }

        $admin = User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'status' => UserStatus::Active,
        ]);
        $admin->forceFill(['email_verified_at' => now(), 'national_access' => true])->save();
        $admin->assignRole('admin');
        $activity->record(ActivityAction::Created, ActivityModule::Users, $admin, label: $admin->name);

        $this->info("Administrator {$email} created. Sign in and manage everyone else in Settings → Users.");

        return self::SUCCESS;
    }
}
