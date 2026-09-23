<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Concerns\RegistrationDetailsRules;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules, RegistrationDetailsRules;

    /**
     * Validate and create a newly registered user. Public registrations wait
     * for an administrator to approve them before they can sign in.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        $input['mobile_number'] = $this->normalizeMobileNumber($input['mobile_number'] ?? null);

        Validator::make($input, [
            ...$this->profileRules(),
            'survey_hei_id' => $this->heiRules(),
            'mobile_number' => $this->mobileNumberRules(),
            'sex' => $this->sexRules(),
            'password' => $this->passwordRules(),
        ], $this->registrationDetailsMessages())->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'survey_hei_id' => (int) $input['survey_hei_id'],
            'mobile_number' => $input['mobile_number'],
            'sex' => $input['sex'],
            'status' => UserStatus::Pending,
        ]);

        $user->assignRole('hei');

        return $user;
    }
}
