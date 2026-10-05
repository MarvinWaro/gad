<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;

/**
 * The password that replaces a temporary one. They signed in with the
 * temporary password moments ago, so it is not asked again; the new one
 * must differ from it.
 */
class TemporaryPasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    /** Only a temporary password is replaced here; others need the current one in Settings. */
    public function authorize(): bool
    {
        return $this->user()?->must_change_password === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'password' => [
                ...$this->passwordRules(),
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (is_string($value) && Hash::check($value, $this->user()->password)) {
                        $fail(__('Choose a password different from the temporary one.'));
                    }
                },
            ],
        ];
    }
}
