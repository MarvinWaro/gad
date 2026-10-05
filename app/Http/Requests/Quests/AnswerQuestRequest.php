<?php

namespace App\Http\Requests\Quests;

use App\Models\Quest;
use Illuminate\Foundation\Http\FormRequest;

/**
 * A player's choice for one question, by its key in their attempt;
 * PlayQuest checks it belongs to the question.
 */
class AnswerQuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quest = $this->route('quest');

        return $quest instanceof Quest && ($this->user()?->can('play', $quest) ?? false);
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'question' => ['required', 'integer'],
            'choice' => ['required', 'string', 'max:64'],
        ];
    }
}
