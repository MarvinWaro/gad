<?php

namespace App\Concerns;

use App\Models\Role;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait StaffOfficeRules
{
    /**
     * A staff account's office: national access, or one region. Both may be
     * left out to keep the account's current office, except for the regional
     * CHED roles (Role::needsRegion), which always belong to one region:
     * only Administrators cover every region.
     *
     * @return array<string, array<int, Closure|ValidationRule|string>>
     */
    protected function officeRules(): array
    {
        $needsRegion = fn (): bool => Role::needsRegion(Role::slugsOf($this->input('role_ids')));

        return [
            'national_access' => [
                'sometimes',
                'boolean',
                function (string $attribute, mixed $value, Closure $fail) use ($needsRegion): void {
                    if (filter_var($value, FILTER_VALIDATE_BOOLEAN) && $needsRegion()) {
                        $fail(__('CHED Focal and CHED Employee accounts belong to one region. Only Administrators cover every region.'));
                    }
                },
            ],
            'survey_region_id' => [
                // Left out, it keeps the account's office; a regional CHED
                // role must always name its region.
                Rule::requiredIf($needsRegion),
                'nullable',
                'integer',
                Rule::exists('survey_regions', 'id'),
                'prohibited_if_accepted:national_access',
            ],
        ];
    }

    /** @return array<string, string> */
    protected function officeMessages(): array
    {
        return [
            'survey_region_id.required' => __('Choose the regional office this CHED account belongs to.'),
        ];
    }
}
