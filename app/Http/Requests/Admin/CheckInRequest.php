<?php

namespace App\Http\Requests\Admin;

use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A participant code from the scanner: read by its camera or typed by
 * staff. CheckInParticipant reads the code itself, so a messy one gets a
 * plain answer rather than a format error.
 */
class CheckInRequest extends FormRequest
{
    public function authorize(): bool
    {
        $event = $this->route('event');

        return $event instanceof GadEvent && ($this->user()?->can('checkIn', $event) ?? false);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:40'],
            'method' => ['required', 'string', Rule::in(GadEventCheckIn::METHODS)],
        ];
    }
}
