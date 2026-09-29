<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait StaffOfficeRules
{
    /**
     * A staff account's office: national access, or one region. Both may be
     * left out to keep the account's current office.
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    protected function officeRules(): array
    {
        return [
            'national_access' => ['sometimes', 'boolean'],
            'survey_region_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('survey_regions', 'id'),
                'prohibited_if_accepted:national_access',
            ],
        ];
    }
}
