<?php

namespace App\Support;

use App\Models\QuestAttempt;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * A person's GAD Quest badges: one per quest they finished, at the level of
 * their best attempt, newest first. Shown on My Profile and the quest list.
 */
class QuestAchievements
{
    /** @return list<array<string, mixed>> */
    public static function for(User $user): array
    {
        $badges = QuestBadges::load();

        return array_values(QuestAttempt::query()
            ->where('user_id', $user->id)
            ->finished()
            ->withScore()
            ->with(['quest' => fn ($query) => $query->withCount('questions')->with('region:id,name')])
            ->get()
            ->groupBy('quest_id')
            ->map(function (Collection $attempts) use ($badges): array {
                /** @var QuestAttempt $best */
                $best = $attempts->sortBy([['score', 'desc'], ['finished_at', 'asc']])->first();

                return QuestPlayState::badge($best->quest, (int) $best->score, (int) $best->quest->getAttribute('questions_count'), $best, $badges);
            })
            ->sortByDesc('earned_at')
            ->all());
    }
}
