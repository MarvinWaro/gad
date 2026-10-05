<?php

namespace App\Policies;

use App\Enums\QuestStatus;
use App\Models\Quest;
use App\Models\User;

/**
 * Who may write, run and play a GAD quest. Staff work on the quests of the
 * region their office covers; a quest for every region is the Central
 * Office's. Whether a quest can be started right now (open, retakes) is the
 * game's rule, which PlayQuest checks.
 */
class QuestPolicy
{
    /** The staff list of quests. */
    public function manage(User $user): bool
    {
        return $user->hasPermissionTo('quests.view') && $user->hasOffice();
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('quests.create') && $user->hasOffice();
    }

    /** The quest's results and its questions, answers included. */
    public function results(User $user, Quest $quest): bool
    {
        return $user->hasPermissionTo('quests.view') && $user->reachesRegion($quest->survey_region_id);
    }

    public function update(User $user, Quest $quest): bool
    {
        return $user->hasPermissionTo('quests.update') && $user->reachesRegion($quest->survey_region_id);
    }

    public function delete(User $user, Quest $quest): bool
    {
        return $user->hasPermissionTo('quests.delete') && $user->reachesRegion($quest->survey_region_id);
    }

    /** The player's list of quests and badges. */
    public function playAny(User $user): bool
    {
        return $user->playsQuests();
    }

    /**
     * See the quest and play it: a player of its region (or of any region,
     * for a quest for every region), once it is published. Its author wrote
     * the answers, so they do not play it.
     */
    public function play(User $user, Quest $quest): bool
    {
        return $user->playsQuests()
            && $quest->status !== QuestStatus::Draft
            && $quest->created_by !== $user->id
            && ($quest->survey_region_id === null || $quest->survey_region_id === $user->regionId());
    }
}
