<?php

namespace App\Http\Requests\Quests;

use App\Enums\QuestStatus;
use App\Models\Quest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Opening a quest to its players (publishing or reopening it), or closing it. */
class QuestStatusRequest extends FormRequest
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
            'status' => ['required', Rule::in([QuestStatus::Open->value, QuestStatus::Closed->value])],
        ];
    }

    public function status(): QuestStatus
    {
        return QuestStatus::from((string) $this->validated('status'));
    }
}
