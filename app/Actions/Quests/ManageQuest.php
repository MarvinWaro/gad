<?php

namespace App\Actions\Quests;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\QuestStatus;
use App\Models\Quest;
use App\Services\ActivityRecorder;
use Illuminate\Validation\ValidationException;

/**
 * Runs a quest once it is written: opening it to its players (publishing a
 * draft, or reopening a closed quest), closing it, letting players retake
 * it, and deleting one nobody has played.
 */
final class ManageQuest
{
    public function __construct(private readonly ActivityRecorder $activity) {}

    public function open(Quest $quest): void
    {
        if ($quest->status === QuestStatus::Open) {
            return;
        }

        $quest->update([
            'status' => QuestStatus::Open,
            'published_at' => $quest->published_at ?? now(),
        ]);
        $this->activity->record(ActivityAction::Published, ActivityModule::Quests, $quest);
    }

    /** Players can no longer start or finish it; their badges stay. */
    public function close(Quest $quest): void
    {
        if ($quest->status !== QuestStatus::Open) {
            return;
        }

        $quest->update(['status' => QuestStatus::Closed]);
        $this->activity->record(ActivityAction::Closed, ActivityModule::Quests, $quest);
    }

    /** With retakes on, a player who finished may play again; their best attempt counts. */
    public function setRetakes(Quest $quest, bool $allowed): void
    {
        $quest->update(['allow_retakes' => $allowed]);
        $this->activity->recordSave(ActivityModule::Quests, $quest);
    }

    public function delete(Quest $quest): void
    {
        if ($quest->hasAttempts()) {
            throw ValidationException::withMessages([
                'quest' => __('People have played this quest, so it cannot be deleted. Close it instead.'),
            ]);
        }

        $quest->delete();
        $this->activity->record(ActivityAction::Deleted, ActivityModule::Quests, $quest);
    }
}
