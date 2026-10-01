<?php

namespace App\Http\Requests\Settings;

use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRegionRegistrationRequest extends FormRequest
{
    /** User managers, for the regions their office covers. */
    public function authorize(): bool
    {
        /** @var SurveyRegion $region */
        $region = $this->route('region');

        return $this->user()?->can('users.update') === true
            && $this->user()->reachesRegion($region->id);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'open' => ['required', 'boolean'],
            // An ISO 8601 time with its offset. Closing ignores it.
            'until' => ['nullable', 'date', 'after:now'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['until.after' => __('Choose a closing time that is still to come.')];
    }

    /**
     * The region's registration settings, the closing time in UTC.
     *
     * @return array{instant_registration: bool, instant_registration_until: CarbonImmutable|null}
     */
    public function settings(): array
    {
        $open = $this->boolean('open');
        $until = $this->validated('until');

        return [
            'instant_registration' => $open,
            'instant_registration_until' => $open && $until ? CarbonImmutable::parse($until)->utc() : null,
        ];
    }
}
