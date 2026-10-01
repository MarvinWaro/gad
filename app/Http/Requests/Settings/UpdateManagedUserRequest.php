<?php

namespace App\Http\Requests\Settings;

use App\Concerns\RegistrationDetailsRules;
use App\Concerns\StaffOfficeRules;
use App\Models\Role;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Changes to an account from user management. Where it belongs follows its
 * roles, as when it was created; contact details stay the account holder's.
 */
class UpdateManagedUserRequest extends FormRequest
{
    use RegistrationDetailsRules, StaffOfficeRules;

    public function authorize(): bool
    {
        return $this->user()?->can('users.update') === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->route('user')),
            ],
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'survey_hei_id' => $this->heiRules(
                fn (): bool => Role::includesHei(Role::slugsOf($this->input('role_ids'))),
                activeOnly: false,
            ),
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')],
            ...$this->officeRules(),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            ...$this->registrationDetailsMessages(),
            'survey_hei_id.required' => __('Choose the institution this HEI account belongs to.'),
        ];
    }
}
