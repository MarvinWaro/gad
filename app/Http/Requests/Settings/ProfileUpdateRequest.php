<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use App\Concerns\RegistrationDetailsRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules, RegistrationDetailsRules;

    protected function prepareForValidation(): void
    {
        // Only when sent, so saving the name alone keeps the number.
        if ($this->has('mobile_number')) {
            $this->merge(['mobile_number' => $this->normalizeMobileNumber($this->input('mobile_number'))]);
        }
    }

    /**
     * Get the validation rules that apply to the request. Contact details are
     * optional: registration leaves them for the account holder to add here.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->user()->id),
            'mobile_number' => $this->mobileNumberRules(required: false),
            'sex' => $this->sexRules(required: false),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return $this->registrationDetailsMessages();
    }
}
