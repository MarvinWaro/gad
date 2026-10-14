<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Staff calling an event off, or putting it back on. The route's policy
 * decides who may.
 */
class EventCancellationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'cancelled' => ['required', 'boolean'],
        ];
    }
}
