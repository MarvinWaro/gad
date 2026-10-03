<?php

namespace App\Http\Requests\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Support\PlaceFilters;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/**
 * The activity log's filters: search, module, action, one person, a range
 * of days in Philippine time, and place.
 */
class ActivityLogFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('activity-logs.view') === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            ...Arr::only(PlaceFilters::rules(), ['region', 'hei', 'search', 'page']),
            'module' => ['nullable', Rule::enum(ActivityModule::class)],
            'action' => ['nullable', Rule::enum(ActivityAction::class)],
            'user' => ['nullable', 'integer', 'exists:users,id'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }
}
