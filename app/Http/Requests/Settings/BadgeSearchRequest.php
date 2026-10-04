<?php

namespace App\Http\Requests\Settings;

use App\Models\Badge;
use Illuminate\Foundation\Http\FormRequest;

/** A search in Settings → Badges: badges in the list, holders on a badge's page. */
class BadgeSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        $badge = $this->route('badge');

        return $badge instanceof Badge
            ? $this->user()?->can('view', $badge) ?? false
            : $this->user()?->can('manage', Badge::class) ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function search(): string
    {
        return trim((string) $this->validated('search'));
    }
}
