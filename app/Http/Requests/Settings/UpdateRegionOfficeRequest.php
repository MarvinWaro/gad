<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRegionOfficeRequest extends FormRequest
{
    /** The Central Office for any region, an office for its own (SurveyRegionPolicy). */
    public function authorize(): bool
    {
        return $this->user()?->can('updateOffice', $this->route('region')) === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'office_city' => ['nullable', 'string', 'max:120'],
            'office_address' => ['nullable', 'string', 'max:255'],
            'office_email' => ['nullable', 'email', 'max:255'],
            'office_website' => ['nullable', 'string', 'max:120', 'regex:/^[^\s]+\.[^\s]+$/'],
            'office_phone' => ['nullable', 'string', 'max:120'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['office_website.regex' => __('Enter the website as an address, such as example.gov.ph.')];
    }
}
