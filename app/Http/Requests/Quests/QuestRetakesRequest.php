<?php

namespace App\Http\Requests\Quests;

use App\Models\Quest;
use Illuminate\Foundation\Http\FormRequest;

/** Letting players who finished a quest play it again, or not. */
class QuestRetakesRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quest = $this->route('quest');

        return $quest instanceof Quest && ($this->user()?->can('update', $quest) ?? false);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'allow_retakes' => ['required', 'boolean'],
        ];
    }
}
