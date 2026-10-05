<?php

namespace App\Http\Requests\Settings;

use App\Models\Badge;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/** A custom badge awarded by hand, and what for; ManageBadge checks the person may hold it. */
class AwardBadgeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $badge = $this->route('badge');

        return $badge instanceof Badge && ($this->user()?->can('award', $badge) ?? false);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'user' => ['required', 'integer', 'exists:users,id'],
            'note' => ['nullable', 'string', 'max:200'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['user.required' => __('Choose who receives the badge.')];
    }

    public function recipient(): User
    {
        return User::query()->findOrFail((int) $this->validated('user'));
    }

    public function note(): ?string
    {
        $note = $this->validated('note');

        return $note !== null ? (string) $note : null;
    }
}
