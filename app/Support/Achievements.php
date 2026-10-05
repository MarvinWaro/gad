<?php

namespace App\Support;

use App\Models\Badge;
use App\Models\BadgeAward;
use App\Models\User;

/**
 * A person's achievements as profiles and lists show them: the badges they
 * hold and their GAD Quest badges, in one shape. The one place that shape
 * is made.
 *
 * @phpstan-type Achievement array{key: string, name: string, caption: string|null, description: string, medal: string, image: string|null, earned_at: string|null, facts: list<array{label: string, value: string}>}
 * @phpstan-type ToEarn array{key: string, name: string, description: string, criterion: string, medal: string, image: string|null}
 */
class Achievements
{
    /**
     * How great each kind is, greatest first: a GAD Quest Champion, a badge
     * someone was given by hand, an Advocate, a milestone earned by sharing
     * GAD work, then a Participant.
     */
    private const GREATNESS = ['champion' => 0, 'custom' => 1, 'advocate' => 2, 'participant' => 4];

    /** Where an earned milestone ranks among them. */
    private const MILESTONE = 3;

    /**
     * Everything they hold, greatest first and newest first within each, so
     * a profile's highlights are simply the first few.
     *
     * @return list<Achievement>
     */
    public static function for(User $user): array
    {
        $badges = $user->badgeAwards()
            ->with(['badge.region:id,name', 'awarder:id,name'])
            ->get()
            ->map(fn (BadgeAward $award): array => self::fromAward($award));

        $all = self::newestFirst([...$badges->all(), ...self::quests($user)]);
        // usort is stable, so newest first holds within each rank.
        usort($all, fn (array $a, array $b): int => self::greatness($a) <=> self::greatness($b));

        return $all;
    }

    /**
     * The badges for sharing GAD work they have yet to earn, in the order
     * people reach them, with how to earn each. Switched-off badges are left
     * out, since nobody can earn them.
     *
     * @return list<ToEarn>
     */
    public static function toEarn(User $user): array
    {
        return array_values(Badge::query()
            ->whereNotNull('rule')
            ->where('is_active', true)
            ->whereNotIn('id', $user->badgeAwards()->select('badge_id'))
            ->inListOrder()
            ->get()
            ->map(fn (Badge $badge): array => [
                'key' => 'badge:'.$badge->id,
                'name' => $badge->name,
                'description' => $badge->description,
                'criterion' => (string) $badge->rule?->criterion(),
                'medal' => $badge->medal(),
                'image' => $badge->image,
            ])
            ->all());
    }

    /**
     * The GAD Quest levels, Participant first, for the "Still to earn" card.
     *
     * @return list<array{level: string, name: string, image: string|null}>
     */
    public static function questLevels(): array
    {
        return QuestBadges::load()->levels();
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
            'image' => $badge['image'],
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

    /** @param  Achievement  $achievement */
    private static function greatness(array $achievement): int
    {
        return self::GREATNESS[$achievement['medal']] ?? self::MILESTONE;
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
