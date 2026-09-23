<?php

namespace App\Http\Requests\Settings;

use App\Concerns\RegistrationDetailsRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateManagedUserRequest extends FormRequest
{
    use RegistrationDetailsRules;

    public function authorize(): bool
    {
        return $this->user()?->can('users.update') === true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['mobile_number' => $this->normalizeMobileNumber($this->input('mobile_number'))]);
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
            'survey_hei_id' => $this->heiRules(required: false, activeOnly: false),
            'mobile_number' => $this->mobileNumberRules(required: false),
            'sex' => $this->sexRules(required: false),
            'role_ids' => ['required', 'array', 'min:1'],
            'role_ids.*' => ['integer', Rule::exists('roles', 'id')],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return $this->registrationDetailsMessages();
    }
}
