<?php

namespace App\Http\Requests\Monitoring;

use Illuminate\Foundation\Http\FormRequest;

class MonitoringAccessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('users.update');
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['national_access' => ['required', 'boolean'], 'regions' => ['present', 'array'], 'regions.*' => ['integer', 'distinct', 'exists:survey_regions,id']];
    }
}
