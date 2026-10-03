<?php

namespace App\Http\Requests\Settings;

use App\Http\Requests\Settings\Concerns\PlacesStudentCounts;
use App\Models\AcademicYear;
use Illuminate\Foundation\Http\FormRequest;

/** One region's enrollment or graduate figures for one academic year, to delete. */
class DeleteStudentCountsRequest extends FormRequest
{
    use PlacesStudentCounts;

    public function authorize(): bool
    {
        return $this->canPlace('student-counts.delete');
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            ...$this->placeRules(),
            'academic_year' => ['required', 'string', 'exists:academic_years,label'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return $this->placeMessages();
    }

    public function academicYear(): AcademicYear
    {
        return AcademicYear::query()->where('label', $this->validated('academic_year'))->firstOrFail();
    }
}
