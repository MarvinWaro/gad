<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait RegistrationDetailsRules
{
    /** Values accepted for a user's sex. */
    public const SEXES = ['male', 'female'];

    /**
     * Get the validation rules for the user's institution. Public registration
     * only offers active institutions; administrators may keep an account on
     * one that has since been deactivated.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function heiRules(bool $required = true, bool $activeOnly = true): array
    {
        $exists = Rule::exists('survey_heis', 'id');

        return [
            $required ? 'required' : 'nullable',
            'integer',
            $activeOnly ? $exists->where('is_active', true) : $exists,
        ];
    }

    /**
     * Get the validation rules for a Philippine mobile number. Normalize the
     * input with normalizeMobileNumber() first.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function mobileNumberRules(bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            'regex:/^09\d{9}$/',
        ];
    }

    /**
     * Get the validation rules for the user's sex.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function sexRules(bool $required = true): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            Rule::in(self::SEXES),
        ];
    }

    /** @return array<string, string> */
    protected function registrationDetailsMessages(): array
    {
        return [
            'survey_hei_id.required' => __('Select your higher education institution.'),
            'survey_hei_id.exists' => __('Select an institution from the list.'),
            'mobile_number.regex' => __('Enter a valid mobile number, e.g. 0917 123 4567.'),
        ];
    }

    /**
     * Reduce a mobile number to the 11-digit 09XXXXXXXXX form, accepting
     * spaces, dashes, and the +63 country code. Anything unrecognised is
     * returned as digits so validation can reject it.
     */
    protected function normalizeMobileNumber(mixed $value): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $value) ?? '';

        if ($digits === '') {
            return null;
        }

        if (strlen($digits) === 12 && str_starts_with($digits, '639')) {
            return '0'.substr($digits, 2);
        }

        if (strlen($digits) === 10 && str_starts_with($digits, '9')) {
            return '0'.$digits;
        }

        return $digits;
    }
}
