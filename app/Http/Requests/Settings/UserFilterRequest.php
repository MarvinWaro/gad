<?php

namespace App\Http\Requests\Settings;

use App\Enums\UserStatus;
use App\Support\PlaceFilters;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

/** The filters of Settings → Users: status, search, role and place. */
class UserFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.view') === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            ...Arr::only(PlaceFilters::rules(), ['region', 'cluster', 'hei', 'search', 'page']),
            'status' => ['nullable', Rule::enum(UserStatus::class)],
            'role' => ['nullable', 'string', Rule::exists('roles', 'slug')],
        ];
    }
}
