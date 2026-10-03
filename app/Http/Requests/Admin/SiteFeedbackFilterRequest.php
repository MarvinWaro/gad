<?php

namespace App\Http\Requests\Admin;

use App\Enums\FeedbackType;
use App\Support\PlaceFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/** The website feedback list's filters: type, place and a search. */
class SiteFeedbackFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('feedback.view') ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'type' => ['nullable', Rule::enum(FeedbackType::class)],
            ...Arr::only(PlaceFilters::rules(), ['region', 'hei', 'search', 'page']),
        ];
    }
}
