<?php

namespace App\Http\Requests\Admin;

use App\Concerns\EventDaysRules;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The days someone on an event's list came, as staff mark them: every day
 * they attended, so a day left out is unmarked. The route's policy decides
 * who may.
 */
class EventAttendanceRequest extends FormRequest
{
    use EventDaysRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return $this->daysRules();
    }
}
