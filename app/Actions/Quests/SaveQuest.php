<?php

namespace App\Actions\Quests;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\QuestStatus;
use App\Models\Quest;
use App\Models\QuestChoice;
use App\Models\QuestQuestion;
use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Writes a quest and its questions. A new quest starts as a draft. Once
 * anyone has played, its questions and region stay as they were played, so
 * scores and badges keep meaning what they meant; the title and description
 * can still change.
 *
 * @phpstan-type QuestionInput array{prompt: string, explanation: string, choices: list<string>, correct: int}
 * @phpstan-type QuestInput array{title: string, description: string|null, questions: list<QuestionInput>}
 */
final class SaveQuest
{
    public function __construct(private readonly ActivityRecorder $activity) {}

    /** @param QuestInput $input */
    public function create(User $author, ?int $regionId, array $input): Quest
    {
        $quest = DB::transaction(function () use ($author, $regionId, $input): Quest {
            $quest = Quest::query()->create([
                'survey_region_id' => $regionId,
                'title' => $input['title'],
                'description' => $input['description'],
                'status' => QuestStatus::Draft,
                'created_by' => $author->id,
            ]);
            $this->writeQuestions($quest, $input['questions']);

            return $quest;
        });

        $this->activity->record(ActivityAction::Created, ActivityModule::Quests, $quest);

        return $quest;
    }

    /** @param QuestInput $input */
    public function update(Quest $quest, ?int $regionId, array $input): Quest
    {
        $questionsChanged = DB::transaction(function () use ($quest, $regionId, $input): bool {
            $questionsChanged = $this->questionsOf($quest) !== $input['questions'];

            if ($quest->hasAttempts() && ($questionsChanged || $quest->survey_region_id !== $regionId)) {
                throw ValidationException::withMessages([
                    'questions' => __('People have played this quest, so its questions and region stay as they were. Change the title or description, or write a new quest.'),
                ]);
            }

            $quest->update([
                'survey_region_id' => $regionId,
                'title' => $input['title'],
                'description' => $input['description'],
            ]);

            if ($questionsChanged) {
                $quest->questions()->delete();
                $this->writeQuestions($quest, $input['questions']);
            }

            return $questionsChanged;
        });

        $this->activity->recordSave(
            ActivityModule::Quests,
            $quest,
            extra: $questionsChanged ? ['questions' => [null, __('Edited')]] : [],
        );

        return $quest;
    }

    /** @param list<QuestionInput> $questions */
    private function writeQuestions(Quest $quest, array $questions): void
    {
        foreach ($questions as $index => $question) {
            $stored = $quest->questions()->create([
                'position' => $index + 1,
                'prompt' => $question['prompt'],
                'explanation' => $question['explanation'],
            ]);

            $stored->choices()->createMany(array_map(fn (string $label, int $position): array => [
                'position' => $position + 1,
                'label' => $label,
                'is_correct' => $position === $question['correct'],
            ], $question['choices'], array_keys($question['choices'])));
        }
    }

    /**
     * The stored questions in the shape they are written in, to tell whether
     * a save changes them.
     *
     * @return list<QuestionInput>
     */
    private function questionsOf(Quest $quest): array
    {
        return array_values($quest->questions()->with('choices')->get()
            ->map(fn (QuestQuestion $question): array => [
                'prompt' => $question->prompt,
                'explanation' => $question->explanation,
                'choices' => array_values($question->choices->map(fn (QuestChoice $choice): string => $choice->label)->all()),
                'correct' => (int) $question->choices->search(fn (QuestChoice $choice): bool => $choice->is_correct),
            ])
            ->all());
    }
}
