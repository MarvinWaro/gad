<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use App\Support\PlaceFilters;
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
            ...PlaceFilters::rules(),
            'semester' => ['nullable', 'in:1,2'],
            'status' => ['nullable', Rule::in(MonitoringReport::STATUSES)],
        ];
    }
}
