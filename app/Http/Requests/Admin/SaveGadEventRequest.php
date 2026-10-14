<?php

namespace App\Http\Requests\Admin;

use App\Models\GadEvent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A GAD event as staff enter it. A regional office's event is always for its
 * own region; the Central Office picks a region, or none for every region.
 */
class SaveGadEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        $event = $this->route('event');

        return $event instanceof GadEvent
            ? $this->user()?->can('update', $event) ?? false
            : $this->user()?->can('create', GadEvent::class) ?? false;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'category' => ['required', 'string', Rule::in(GadEvent::CATEGORIES)],
            // On the public website unless turned off; deadlines never are.
            'is_public' => ['sometimes', 'boolean'],
            'region' => $this->writer()->national_access
                ? ['nullable', 'integer', 'exists:survey_regions,id']
                : ['nullable'],
            'is_all_day' => ['required', 'boolean'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            // Null: open until the event ends (docs/event-registration.md).
            'registration_closes_at' => ['nullable', 'date'],
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
     * Registration can't outlast the event.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $attributes = $this->eventAttributes();
                $closes = $attributes['registration_closes_at'];
                $end = $attributes['ends_at'] ?? $attributes['starts_at']->endOfDay()->startOfSecond();

                if ($closes !== null && $closes->greaterThan($end)) {
                    $validator->errors()->add('registration_closes_at', __('Registration must close by the time the event ends.'));
                }
            },
        ];
    }

    /**
     * Validated attributes ready to save. All-day events span whole days so
     * the calendar and the upcoming list treat them alike. A deadline has no
     * registration: nobody attends it.
     *
     * @return array{survey_region_id: int|null, title: string, category: string, is_public: bool, is_all_day: bool, starts_at: CarbonImmutable, ends_at: CarbonImmutable|null, registration_closes_at: CarbonImmutable|null, location: string|null, description: string|null}
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
            'survey_region_id' => $this->regionId(),
            'title' => $validated['title'],
            'category' => $validated['category'],
            // Left out, a new event is public and a saved one keeps its choice.
            'is_public' => (bool) ($validated['is_public'] ?? ($this->route('event') instanceof GadEvent ? $this->route('event')->is_public : true)),
            'is_all_day' => (bool) $validated['is_all_day'],
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'registration_closes_at' => isset($validated['registration_closes_at']) && $validated['category'] !== 'deadline'
                ? CarbonImmutable::parse($validated['registration_closes_at'])->startOfMinute()
                : null,
            'location' => $validated['location'] ?? null,
            'description' => $validated['description'] ?? null,
        ];
    }

    /** The event's region: a regional office's own; the Central Office's pick, or none for every region. */
    public function regionId(): ?int
    {
        $user = $this->writer();

        if (! $user->national_access) {
            return $user->survey_region_id;
        }

        $region = $this->validated('region');

        return $region !== null ? (int) $region : null;
    }

    private function writer(): User
    {
        /** @var User */
        return $this->user();
    }
}
