<?php

namespace App\Http\Requests\Settings;

use App\Models\AcademicYear;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can($this->isMethod('post') ? 'academic-years.create' : 'academic-years.update') === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
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

    /**
     * The validated year, typed for ManageAcademicYear.
     *
     * @return array{start_year: int, is_active?: bool}
     */
    public function yearData(): array
    {
        $validated = $this->validated();
        $data = ['start_year' => (int) $validated['start_year']];

        if (array_key_exists('is_active', $validated)) {
            $data['is_active'] = (bool) $validated['is_active'];
        }

        return $data;
    }
}
