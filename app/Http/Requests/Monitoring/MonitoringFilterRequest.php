<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MonitoringFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'academic_year' => ['nullable', 'regex:/^\d{4}-\d{4}$/'],
            'semester' => ['nullable', 'in:1,2'],
            'status' => ['nullable', Rule::in(MonitoringReport::STATUSES)],
            'region' => ['nullable', 'integer', 'exists:survey_regions,id'],
            'cluster' => ['nullable', 'integer', 'exists:survey_clusters,id'],
            'hei' => ['nullable', 'integer', 'exists:survey_heis,id'],
            'search' => ['nullable', 'string', 'max:150'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
