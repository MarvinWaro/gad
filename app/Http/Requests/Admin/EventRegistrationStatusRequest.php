<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Staff closing an event's registration now, or reopening it until the
 * event ends. The route's policy decides who may.
 */
class EventRegistrationStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'open' => ['required', 'boolean'],
        ];
    }
}
