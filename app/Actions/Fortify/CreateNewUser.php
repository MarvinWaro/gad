<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Concerns\RegistrationDetailsRules;
use App\Enums\UserStatus;
use App\Models\SurveyHei;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules, RegistrationDetailsRules;

    /**
     * Validate and create a newly registered user. Public registrations wait
     * for an administrator to approve them before they can sign in, unless
     * the HEI's region has opened on-the-spot registration.
     *
     * Registration asks only for what the account needs. Contact details,
     * such as a mobile number, are added later on the Profile page.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'survey_hei_id' => $this->heiRules(),
            'password' => $this->passwordRules(),
        ], $this->registrationDetailsMessages())->validate();

        $region = SurveyHei::query()->with('cluster.region')->findOrFail((int) $input['survey_hei_id'])->cluster->region;

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
            'survey_hei_id' => (int) $input['survey_hei_id'],
            'status' => $region->isOpenForInstantRegistration() ? UserStatus::Active : UserStatus::Pending,
        ]);

        $user->assignRole('hei');

        return $user;
    }
}
