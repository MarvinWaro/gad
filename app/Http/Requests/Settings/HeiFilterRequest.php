<?php

namespace App\Http\Requests\Settings;

use App\Support\PlaceFilters;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

/** The filters of Settings → HEIs: name or UII, place, status and ownership. */
class HeiFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('survey-directories.view') === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            ...Arr::only(PlaceFilters::rules(), ['region', 'search', 'page']),
            'status' => ['nullable', 'in:active,inactive'],
            // "none": the ownership is not set yet.
            'ownership' => ['nullable', 'in:public,private,none'],
        ];
    }
}
