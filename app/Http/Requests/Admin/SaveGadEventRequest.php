<?php

namespace App\Http\Requests\Admin;

use App\Models\GadEvent;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveGadEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can($this->isMethod('post') ? 'events.create' : 'events.update') === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'category' => ['required', 'string', Rule::in(GadEvent::CATEGORIES)],
            'is_all_day' => ['required', 'boolean'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'location' => ['nullable', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'ends_at.after_or_equal' => __('The end must be on or after the start.'),
        ];
    }

    /**
     * Validated attributes ready to save. All-day events span whole days so
     * the calendar and the upcoming list treat them alike.
     *
     * @return array<string, mixed>
     */
    public function eventAttributes(): array
    {
        $validated = $this->validated();
        $startsAt = CarbonImmutable::parse($validated['starts_at']);
        $endsAt = isset($validated['ends_at']) ? CarbonImmutable::parse($validated['ends_at']) : null;

        if ($validated['is_all_day']) {
            $startsAt = $startsAt->startOfDay();
            $endsAt = ($endsAt ?? $startsAt)->endOfDay()->startOfSecond();
        }

        return [
            'title' => $validated['title'],
            'category' => $validated['category'],
            'is_all_day' => (bool) $validated['is_all_day'],
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'] ?? null,
        ];
    }
}
