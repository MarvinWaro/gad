<?php

namespace App\Http\Requests\Settings;

use App\Models\Badge;
use Illuminate\Foundation\Http\FormRequest;

/** Switching a badge on or off from the list. */
class BadgeStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $badge = $this->route('badge');

        return $badge instanceof Badge && ($this->user()?->can('update', $badge) ?? false);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return ['is_active' => ['required', 'boolean']];
    }
}
