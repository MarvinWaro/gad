<?php

namespace App\Http\Requests\Monitoring;

use App\Enums\ChecklistType;
use App\Models\ChecklistResponse;
use App\Support\AcademicPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubmitChecklistRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('submit', ChecklistResponse::class) === true;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var ChecklistType $type */
        $type = $this->route('type');

        return [
            'academic_year' => ['required', 'string', Rule::in(AcademicPeriod::options())],
            // Checking none is an answer too.
            'items' => ['present', 'array'],
            'items.*' => ['string', 'distinct', Rule::in(array_keys($type->items()))],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'academic_year.in' => __('Choose an academic year from the list.'),
            'items.*.in' => __('Choose items from the list.'),
        ];
    }
}
