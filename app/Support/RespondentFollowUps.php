<?php

namespace App\Support;

use App\Models\SurveyGroupAnswer;
use App\Models\SurveyGroupOption;
use App\Models\SurveyGroupQuestion;
use App\Models\SurveyRespondentGroup;
use App\Models\SurveyResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The follow-up questions a respondent group asks, as administrators write
 * them under Settings > Respondent groups: Civilian asks "Occupation", with
 * an "Others" choice that opens a "please specify" box. One level deep: a
 * choice can ask for typed detail, never for another question.
 *
 * Questions, choices and answers are rows (survey_group_questions,
 * survey_group_options, survey_group_answers). The public form and the
 * settings editor exchange a question as
 *
 *     ['key' => 'occupation', 'label' => 'Occupation', 'type' => 'select',
 *      'required' => true, 'options' => [
 *          ['value' => 'farmer', 'label' => 'Farmer'],
 *          ['value' => 'others', 'label' => 'Others', 'requires_text' => true],
 *      ]]
 *
 * (see SurveyRespondentGroup::followUps()). Keys and choice values never
 * change once saved, and a question or choice that has been answered is
 * retired instead of deleted, so collected answers always keep their meaning.
 */
final class RespondentFollowUps
{
    /** How a question is shown: a dropdown, or buttons for short lists. */
    public const TYPES = ['select', 'radio'];

    public const MAX_QUESTIONS = 10;

    /**
     * Rules for answering a group's questions. The submitted answers decide
     * which "please specify" boxes must be filled in.
     *
     * @param  list<array<string, mixed>>  $questions  the group's followUps()
     * @return array<string, mixed>
     */
    public static function answerRules(array $questions, mixed $answers): array
    {
        $answers = is_array($answers) ? $answers : [];
        $rules = [
            'group_answers' => ['sometimes', 'nullable', 'array'],
            'group_answer_details' => ['sometimes', 'nullable', 'array'],
        ];

        foreach ($questions as $question) {
            $key = $question['key'];
            $rules["group_answers.{$key}"] = [
                $question['required'] ? 'required' : 'nullable',
                'string',
                Rule::in(self::values($question)),
            ];
            $rules["group_answer_details.{$key}"] = [
                Rule::requiredIf(in_array($answers[$key] ?? null, self::values($question, textOnly: true), true)),
                'nullable',
                'string',
                'max:160',
            ];
        }

        return $rules;
    }

    /**
     * Readable names for the answer rules' messages.
     *
     * @param  list<array<string, mixed>>  $questions
     * @return array<string, string>
     */
    public static function answerAttributes(array $questions): array
    {
        $names = [];
        foreach ($questions as $question) {
            $names["group_answers.{$question['key']}"] = "“{$question['label']}”";
            $names["group_answer_details.{$question['key']}"] = "“{$question['label']}” details";
        }

        return $names;
    }

    /**
     * Store a response's answers: the chosen group's own questions only, with
     * the specified text where the chosen choice asks for it.
     *
     * @param  SurveyRespondentGroup|null  $group  with followUpQuestions.activeOptions loaded
     * @param  array<string, mixed>  $validated
     */
    public static function saveAnswers(SurveyResponse $response, ?SurveyRespondentGroup $group, array $validated): void
    {
        $rows = [];
        foreach ($group->followUpQuestions ?? [] as $question) {
            $value = $validated['group_answers'][$question->key] ?? null;
            $option = $question->activeOptions->firstWhere('value', $value);
            if (! $option instanceof SurveyGroupOption) {
                continue;
            }

            $text = $validated['group_answer_details'][$question->key] ?? null;
            $rows[] = [
                'survey_response_id' => $response->id,
                'question_id' => $question->id,
                'option_id' => $option->id,
                'text' => $option->requires_text && is_string($text) && trim($text) !== '' ? trim($text) : null,
            ];
        }

        if ($rows !== []) {
            SurveyGroupAnswer::query()->insert($rows);
        }
    }

    /**
     * A response's answers as question label => readable answer, in the
     * questions' order. Retired questions and choices still read correctly.
     *
     * @return array<string, string>
     */
    public static function describe(SurveyResponse $response): array
    {
        $response->loadMissing('groupAnswers.question', 'groupAnswers.option');

        $described = [];
        foreach ($response->groupAnswers->sortBy(fn (SurveyGroupAnswer $answer): int => $answer->question->sort_order) as $answer) {
            $described[$answer->question->label] = self::answerText($answer);
        }

        return $described;
    }

    /** One answer, readable: the choice's label, then what was specified. */
    public static function answerText(?SurveyGroupAnswer $answer): string
    {
        if ($answer === null) {
            return '';
        }

        return filled($answer->text) ? "{$answer->option->label}: {$answer->text}" : $answer->option->label;
    }

    /**
     * Rules for the questions an administrator writes.
     *
     * @return array<string, mixed>
     */
    public static function definitionRules(): array
    {
        return [
            'follow_ups' => ['present', 'array', 'max:'.self::MAX_QUESTIONS],
            'follow_ups.*.key' => ['nullable', 'string', 'max:60'],
            'follow_ups.*.label' => ['required', 'string', 'max:160'],
            'follow_ups.*.type' => ['required', Rule::in(self::TYPES)],
            'follow_ups.*.required' => ['required', 'boolean'],
            'follow_ups.*.options' => ['required', 'array', 'min:1', 'max:50'],
            'follow_ups.*.options.*.value' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9-]+$/'],
            'follow_ups.*.options.*.label' => ['required', 'string', 'max:160'],
            'follow_ups.*.options.*.requires_text' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * Readable names for the definition rules' messages.
     *
     * @return array<string, string>
     */
    public static function definitionAttributes(): array
    {
        return [
            'follow_ups.*.label' => 'question',
            'follow_ups.*.options' => 'choices',
            'follow_ups.*.options.*.label' => 'choice',
        ];
    }

    /**
     * Save the questions an administrator wrote for a group, in order.
     *
     * A question keeps the key it was saved with; a new one takes a key from
     * its label, never one any question of the group has had. Questions and
     * choices left out are deleted, or retired if they have been answered, so
     * the answers keep their meaning.
     *
     * @param  array<array-key, array<string, mixed>>  $submitted  the validated questions
     *
     * @throws ValidationException when a question repeats a choice
     */
    public static function sync(SurveyRespondentGroup $group, array $submitted): void
    {
        $submitted = array_values($submitted);
        foreach ($submitted as $index => $question) {
            $values = array_column($question['options'], 'value');
            if (count($values) !== count(array_unique($values))) {
                throw ValidationException::withMessages([
                    "follow_ups.{$index}.options" => 'Each choice in a question needs its own name.',
                ]);
            }
        }

        DB::transaction(function () use ($group, $submitted): void {
            // Retired questions included, so their keys are never reused.
            $existing = $group->questions()->get()->keyBy('key');
            $kept = [];

            foreach ($submitted as $order => $data) {
                $attributes = [
                    'label' => trim($data['label']),
                    'type' => $data['type'],
                    'required' => (bool) $data['required'],
                    'sort_order' => $order,
                    'is_active' => true,
                ];

                $question = is_string($data['key'] ?? null) ? $existing->get($data['key']) : null;
                if ($question instanceof SurveyGroupQuestion && ! in_array($question->id, $kept, true)) {
                    $question->update($attributes);
                } else {
                    $question = $group->questions()->create([
                        ...$attributes,
                        'key' => self::uniqueKey(Str::slug($data['label']) ?: 'question', array_map(strval(...), $existing->keys()->all())),
                    ]);
                    $existing->put($question->key, $question);
                }

                $kept[] = $question->id;
                self::syncOptions($question, array_values($data['options']));
            }

            foreach ($existing as $question) {
                if (! in_array($question->id, $kept, true)) {
                    self::retireOrDelete($question);
                }
            }
        });
    }

    /**
     * Save a question's choices in order, keeping each value it was saved
     * with. Choices left out are deleted, or retired if they have been picked.
     *
     * @param  list<array<string, mixed>>  $submitted
     */
    private static function syncOptions(SurveyGroupQuestion $question, array $submitted): void
    {
        $existing = $question->options()->get()->keyBy('value');
        $kept = [];

        foreach ($submitted as $order => $data) {
            $attributes = [
                'label' => trim($data['label']),
                'requires_text' => (bool) ($data['requires_text'] ?? false),
                'sort_order' => $order,
                'is_active' => true,
            ];

            $option = $existing->get($data['value']);
            if ($option instanceof SurveyGroupOption) {
                $option->update($attributes);
            } else {
                $option = $question->options()->create([...$attributes, 'value' => $data['value']]);
            }
            $kept[] = $option->id;
        }

        foreach ($existing as $option) {
            if (! in_array($option->id, $kept, true)) {
                self::retireOrDelete($option);
            }
        }
    }

    /** Delete a question or choice, or retire it if it has been answered. */
    private static function retireOrDelete(SurveyGroupQuestion|SurveyGroupOption $record): void
    {
        if ($record->answers()->exists()) {
            $record->update(['is_active' => false]);
        } else {
            $record->delete();
        }
    }

    /**
     * A question's choice values, or only those that ask to specify.
     *
     * @param  array<string, mixed>  $question
     * @return list<string>
     */
    private static function values(array $question, bool $textOnly = false): array
    {
        $values = [];
        foreach ($question['options'] ?? [] as $option) {
            if (! $textOnly || ($option['requires_text'] ?? false)) {
                $values[] = (string) $option['value'];
            }
        }

        return $values;
    }

    /** @param array<int, string> $taken */
    private static function uniqueKey(string $base, array $taken): string
    {
        $key = $base;
        for ($suffix = 2; in_array($key, $taken, true); $suffix++) {
            $key = "{$base}-{$suffix}";
        }

        return $key;
    }
}
