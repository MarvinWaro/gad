<?php

namespace App\Actions\Quests;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\QuestLevel;
use App\Enums\QuestStatus;
use App\Models\Quest;
use App\Models\QuestAnswer;
use App\Models\QuestAttempt;
use App\Models\QuestChoice;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\ActivityPlace;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The game: starting a quest and answering its questions one at a time.
 * Each player plays a quest once, unless its staff turn retakes on. An
 * attempt finishes with its last answer.
 */
final class PlayQuest
{
    public function __construct(private readonly ActivityRecorder $activity) {}

    /** Starts an attempt, or carries on with the one already under way. */
    public function start(Quest $quest, User $player): QuestAttempt
    {
        return DB::transaction(function () use ($quest, $player): QuestAttempt {
            $this->ensureOpen($quest);

            $attempts = $quest->attempts()->where('user_id', $player->id)->lockForUpdate()->get();
            $unfinished = $attempts->first(fn (QuestAttempt $attempt): bool => ! $attempt->isFinished());

            if ($unfinished !== null) {
                return $unfinished;
            }

            if ($attempts->isNotEmpty() && ! $quest->allow_retakes) {
                throw ValidationException::withMessages([
                    'quest' => __('You have already played this quest.'),
                ]);
            }

            return $quest->attempts()->create([
                'user_id' => $player->id,
                'survey_region_id' => $player->regionId(),
                'survey_hei_id' => $player->survey_hei_id,
                'started_at' => now(),
            ]);
        });
    }

    /**
     * Records the player's choice for one question of their attempt under
     * way. The choice comes by its key in the attempt, as the page shows it.
     */
    public function answer(Quest $quest, User $player, int $questionId, string $choiceKey): QuestAnswer
    {
        [$answer, $attempt] = DB::transaction(function () use ($quest, $player, $questionId, $choiceKey): array {
            $this->ensureOpen($quest);

            $attempt = $quest->attempts()
                ->where('user_id', $player->id)
                ->whereNull('finished_at')
                ->lockForUpdate()
                ->first();

            if ($attempt === null) {
                throw ValidationException::withMessages(['answer' => __('Start the quest first.')]);
            }

            $choice = $quest->questions()->with('choices')->find($questionId)?->choices
                ->first(fn (QuestChoice $choice): bool => hash_equals($attempt->keyFor($choice->id), $choiceKey));
            if ($choice === null) {
                throw ValidationException::withMessages(['answer' => __('That answer is not one of this question\'s choices.')]);
            }

            if ($attempt->answers()->where('quest_question_id', $questionId)->exists()) {
                throw ValidationException::withMessages(['answer' => __('You have already answered this question.')]);
            }

            $answer = $attempt->answers()->create([
                'quest_question_id' => $questionId,
                'quest_choice_id' => $choice->id,
            ]);

            if ($attempt->answers()->count() >= $quest->questions()->count()) {
                $attempt->update(['finished_at' => now()]);
            }

            return [$answer, $attempt];
        });

        if ($attempt->isFinished()) {
            $this->recordFinish($quest, $attempt, $player);
        }

        return $answer;
    }

    private function ensureOpen(Quest $quest): void
    {
        if ($quest->status !== QuestStatus::Open) {
            throw ValidationException::withMessages(['quest' => __('This quest is closed.')]);
        }
    }

    private function recordFinish(Quest $quest, QuestAttempt $attempt, User $player): void
    {
        $score = (int) QuestAttempt::query()->whereKey($attempt->id)->withScore()->first()?->score;
        $total = $quest->questions()->count();

        $this->activity->record(
            ActivityAction::Completed,
            ActivityModule::Quests,
            $quest,
            properties: [
                'score' => $score,
                'questions' => $total,
                'level' => QuestLevel::fromScore($score, $total)->value,
            ],
            actor: $player,
            place: ActivityPlace::ofHei($attempt->survey_hei_id) ?? new ActivityPlace($attempt->survey_region_id),
        );
    }
}
