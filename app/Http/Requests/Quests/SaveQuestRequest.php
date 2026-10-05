<?php

namespace App\Http\Requests\Quests;

use App\Models\Quest;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * A quest as its staff write it: a title, a short description and exactly
 * five questions, each with 2–4 choices, the correct one, and why. A
 * regional office's quest is always for its own region; the Central Office
 * picks a region, or none for every region.
 */
class SaveQuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $quest = $this->route('quest');

        return $quest instanceof Quest
            ? $this->user()?->can('update', $quest) ?? false
            : $this->user()?->can('create', Quest::class) ?? false;
    }

    /** @return array<string, array<mixed>> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
            'region' => $this->writer()->national_access
                ? ['nullable', 'integer', 'exists:survey_regions,id']
                : ['nullable'],
            'questions' => ['required', 'array', 'size:'.Quest::QUESTIONS],
            'questions.*' => ['required', 'array:prompt,explanation,choices,correct'],
            'questions.*.prompt' => ['required', 'string', 'max:300'],
            'questions.*.explanation' => ['required', 'string', 'max:600'],
            'questions.*.choices' => ['required', 'array', 'min:'.Quest::MIN_CHOICES, 'max:'.Quest::MAX_CHOICES],
            'questions.*.choices.*' => ['required', 'string', 'max:200'],
            'questions.*.correct' => ['required', 'integer', 'min:0'],
        ];
    }

    /**
     * Each question's correct choice is one of its own, and no choice is
     * offered twice.
     *
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                foreach ((array) $this->input('questions', []) as $index => $question) {
                    $offered = array_values((array) ($question['choices'] ?? []));
                    $choices = array_filter($offered, 'is_string');
                    $number = (int) $index + 1;

                    if (! array_key_exists((int) ($question['correct'] ?? -1), $offered)) {
                        $validator->errors()->add("questions.{$index}.correct", __('Mark the correct choice for question :number.', ['number' => $number]));
                    }

                    if (count(array_unique(array_map('mb_strtolower', $choices))) < count($choices)) {
                        $validator->errors()->add("questions.{$index}.choices", __('Question :number offers the same choice twice.', ['number' => $number]));
                    }
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'questions.size' => __('A quest has exactly :size questions.'),
            'questions.*.prompt.required' => __('Write :attribute.'),
            'questions.*.explanation.required' => __('Explain the answer to :attribute.'),
            'questions.*.choices.min' => __('Give :attribute at least :min choices.'),
            'questions.*.choices.max' => __('Give :attribute at most :max choices.'),
            'questions.*.choices.*.required' => __('Fill in :attribute, or remove it.'),
        ];
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        $attributes = [];
        for ($index = 0; $index < Quest::QUESTIONS; $index++) {
            $number = $index + 1;
            $attributes["questions.{$index}.prompt"] = "question {$number}";
            $attributes["questions.{$index}.explanation"] = "question {$number}";
            $attributes["questions.{$index}.choices"] = "question {$number}";
            $attributes["questions.{$index}.correct"] = "question {$number}'s correct choice";
            // Lettered as the form shows them.
            foreach (range('A', 'Z') as $choice => $letter) {
                if ($choice === Quest::MAX_CHOICES) {
                    break;
                }
                $attributes["questions.{$index}.choices.{$choice}"] = "choice {$letter} of question {$number}";
            }
        }

        return $attributes;
    }

    /**
     * The quest in the shape SaveQuest writes and compares it.
     *
     * @return array{title: string, description: string|null, questions: list<array{prompt: string, explanation: string, choices: list<string>, correct: int}>}
     */
    public function quest(): array
    {
        $validated = $this->validated();

        return [
            'title' => (string) $validated['title'],
            'description' => $validated['description'] ?? null,
            'questions' => array_values(array_map(fn (array $question): array => [
                'prompt' => (string) $question['prompt'],
                'explanation' => (string) $question['explanation'],
                'choices' => array_values(array_map('strval', $question['choices'])),
                'correct' => (int) $question['correct'],
            ], $validated['questions'])),
        ];
    }

    /** The quest's region: a regional office's own; the Central Office's pick, or none for every region. */
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
