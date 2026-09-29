<?php

namespace App\Http\Requests\Monitoring;

use App\Models\MonitoringReport;
use App\Support\AcademicPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateMonitoringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', MonitoringReport::class) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'academic_year' => ['required', 'string', Rule::in(AcademicPeriod::options())],
            'semester' => ['required', 'integer', Rule::in(AcademicPeriod::SEMESTERS)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['academic_year.in' => __('Choose an academic year from the list.')];
    }
}
