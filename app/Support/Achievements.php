<?php

namespace App\Support;

use App\Models\BadgeAward;
use App\Models\User;

/**
 * A person's achievements as profiles and lists show them: the badges they
 * hold and their GAD Quest badges, in one shape, newest first. The one
 * place that shape is made.
 *
 * @phpstan-type Achievement array{key: string, name: string, caption: string|null, description: string, medal: string, image: string|null, earned_at: string|null, facts: list<array{label: string, value: string}>}
 */
class Achievements
{
    /** @return list<Achievement> */
    public static function for(User $user): array
    {
        $badges = $user->badgeAwards()
            ->with(['badge.region:id,name', 'awarder:id,name'])
            ->get()
            ->map(fn (BadgeAward $award): array => self::fromAward($award));

        return self::newestFirst([...$badges->all(), ...self::quests($user)]);
    }

    /** @return list<Achievement> Their GAD Quest badges only. */
    public static function quests(User $user): array
    {
        return self::newestFirst(array_map(fn (array $badge): array => [
            'key' => 'quest:'.$badge['quest_id'],
            'name' => (string) $badge['title'],
            'caption' => (string) $badge['level_label'],
            'description' => (string) $badge['meaning'],
            'medal' => (string) $badge['level'],
            'image' => null,
            'earned_at' => $badge['earned_at'],
            'facts' => [
                ['label' => __('Score'), 'value' => __(':score of :total correct', ['score' => $badge['score'], 'total' => $badge['total']])],
                ['label' => __('Organizer'), 'value' => (string) $badge['organizer']],
            ],
        ], QuestAchievements::for($user)));
    }

    /** @return Achievement */
    private static function fromAward(BadgeAward $award): array
    {
        $badge = $award->badge;
        $facts = [];

        if (! $badge->isSystem()) {
            $facts[] = ['label' => __('Organizer'), 'value' => $badge->region !== null ? $badge->region->name : __('CHED Central Office')];
            if ($award->awarder !== null) {
                $facts[] = ['label' => __('Awarded by'), 'value' => $award->awarder->name];
            }
            if ($award->note !== null) {
                $facts[] = ['label' => __('For'), 'value' => $award->note];
            }
        }

        return [
            'key' => 'badge:'.$award->id,
            'name' => $badge->name,
            'caption' => null,
            'description' => $badge->description,
            'medal' => $badge->medal(),
            'image' => $badge->image,
            'earned_at' => $award->awarded_at->toIso8601ZuluString(),
            'facts' => $facts,
        ];
    }

    /**
     * @param  list<Achievement>  $achievements
     * @return list<Achievement>
     */
    private static function newestFirst(array $achievements): array
    {
        usort($achievements, fn (array $a, array $b): int => strcmp((string) $b['earned_at'], (string) $a['earned_at']));

        return $achievements;
    }
}
