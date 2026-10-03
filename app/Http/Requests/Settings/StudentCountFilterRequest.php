<?php

namespace App\Http\Requests\Settings;

use App\Enums\StudentCountKind;
use App\Models\User;
use App\Support\PlaceFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/** The enrollment and graduates page's kind, academic year and region. */
class StudentCountFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('student-counts.view') ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'kind' => ['nullable', Rule::enum(StudentCountKind::class)],
            ...Arr::only(PlaceFilters::rules(), ['academic_year', 'region']),
        ];
    }

    public function kind(): StudentCountKind
    {
        return StudentCountKind::tryFrom((string) $this->validated('kind')) ?? StudentCountKind::Enrollment;
    }

    /** The region in view: a regional office's own, or the Central Office's choice (null for every region). */
    public function regionId(): ?int
    {
        /** @var User $user */
        $user = $this->user();

        return $user->national_access
            ? (filled($this->validated('region')) ? (int) $this->validated('region') : null)
            : $user->survey_region_id;
    }

    public function academicYear(): ?string
    {
        $year = $this->validated('academic_year');

        return is_string($year) && $year !== '' ? $year : null;
    }
}
