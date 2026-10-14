<?php

namespace App\Http\Requests\Admin;

use App\Concerns\EventDaysRules;
use App\Concerns\RegistrationDetailsRules;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A guest without an account at an event, as staff add or correct them:
 * who they are, as their certificate prints them, and the days they came.
 * The route's policy decides who may.
 *
 * @phpstan-import-type GuestDetails from \App\Actions\Events\ManageEventGuest
 */
class SaveEventGuestRequest extends FormRequest
{
    use EventDaysRules;
    use RegistrationDetailsRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'organization' => ['required', 'string', 'max:160'],
            'position' => ['nullable', 'string', 'max:120'],
            'sex' => $this->sexRules(required: false),
            ...$this->daysRules(required: false),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => __('Enter the guest\'s name.'),
            'organization.required' => __('Enter their agency or organization.'),
        ];
    }

    /** @return GuestDetails */
    public function details(): array
    {
        $position = trim((string) $this->validated('position'));
        $sex = $this->validated('sex');

        return [
            'name' => trim((string) $this->validated('name')),
            'organization' => trim((string) $this->validated('organization')),
            'position' => $position !== '' ? $position : null,
            'sex' => is_string($sex) ? $sex : null,
        ];
    }
}
