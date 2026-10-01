<?php

namespace App\Http\Requests;

use App\Enums\ActivityModule;
use App\Enums\NotificationKind;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The Notifications page's tabs and filters. */
class NotificationFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(['unread'])],
            'search' => ['nullable', 'string', 'max:150'],
            'kind' => ['nullable', Rule::enum(NotificationKind::class)],
            'module' => ['nullable', Rule::enum(ActivityModule::class)],
        ];
    }
}
