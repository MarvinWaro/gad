<?php

namespace App\Http\Requests\Settings;

use App\Models\GadEvent;
use Illuminate\Foundation\Http\FormRequest;

/** "Use on an event": the GAD event a design's certificates will be for. */
class UseCertificateDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'event' => ['required', 'integer', 'exists:gad_events,id'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'event.required' => __('Choose the event.'),
            'event.exists' => __('That event no longer exists. Choose another.'),
        ];
    }

    public function event(): GadEvent
    {
        return GadEvent::query()->findOrFail((int) $this->validated('event'));
    }
}
