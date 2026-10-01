<?php

namespace App\Http\Requests\Settings;

use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can($this->isMethod('post') ? 'academic-years.create' : 'academic-years.update') === true;
    }

    public function rules(): array
    {
        /** @var AcademicYear|null $year */
        $year = $this->route('academicYear');

        return [
            'start_year' => [
                'required', 'integer', 'between:1000,9998',
                Rule::unique('academic_years', 'start_year')->ignore($year?->id),
            ],
            'is_active' => [$year ? 'required' : 'sometimes', 'boolean'],
        ];
    }
}
