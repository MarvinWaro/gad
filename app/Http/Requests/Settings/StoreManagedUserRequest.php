<?php

namespace App\Http\Requests\Settings;

use App\Concerns\RegistrationDetailsRules;
use App\Concerns\StaffOfficeRules;
use App\Enums\PasswordDelivery;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * An account a user manager creates. Where it belongs follows its roles: an
 * HEI role needs the institution, a CHED role takes an office. Its first
 * password is a random one emailed to its holder, or the shared temporary
 * password (PasswordDelivery); either is replaced at the first sign-in.
 * Contact details are the account holder's to add on their Profile.
 */
class StoreManagedUserRequest extends FormRequest
{
    use RegistrationDetailsRules, StaffOfficeRules;

    public function authorize(): bool
    {
        return $this->user()?->can('users.create') === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'survey_hei_id' => $this->heiRules(
                fn (): bool => Role::includesHei(Role::slugsOf($this->input('role_ids'))),
                activeOnly: false,
            ),
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')],
            'password_delivery' => ['required', Rule::enum(PasswordDelivery::class)],
            ...$this->officeRules(),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            ...$this->registrationDetailsMessages(),
            ...$this->officeMessages(),
            'survey_hei_id.required' => __('Choose the institution this HEI account belongs to.'),
            'password_delivery.required' => __('Choose how they get their first password.'),
        ];
    }
}
