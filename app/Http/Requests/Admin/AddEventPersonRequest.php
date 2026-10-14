<?php

namespace App\Http\Requests\Admin;

use App\Concerns\EventDaysRules;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Staff adding someone with an account to an event's list, by their public
 * ULID, with the days they came if the event has begun. The route's policy
 * decides who may.
 */
class AddEventPersonRequest extends FormRequest
{
    use EventDaysRules;

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'person' => ['required', 'string', Rule::exists('users', 'ulid')->where('status', 'active')],
            ...$this->daysRules(required: false),
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'person.required' => __('Choose someone to add.'),
            'person.exists' => __('Choose someone from the list.'),
        ];
    }

    public function person(): User
    {
        return User::query()->where('ulid', $this->validated('person'))->firstOrFail();
    }
}
