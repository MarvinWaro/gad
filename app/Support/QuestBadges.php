<?php

namespace App\Support;

use App\Enums\QuestLevel;
use App\Models\Badge;
use Illuminate\Support\Collection;
use LogicException;

/**
 * The GAD Quest levels' badges: the name, description and picture Settings →
 * Badges gives each level (docs/badges.md). Load it once where quest badges
 * are shaped, and pass it on.
 */
final class QuestBadges
{
    /** @param  Collection<string, Badge>  $badges  By level code. */
    private function __construct(private readonly Collection $badges) {}

    public static function load(): self
    {
        return new self(Badge::query()
            ->whereNotNull('quest_level')
            ->get()
            ->keyBy(fn (Badge $badge): string => (string) $badge->quest_level?->value));
    }

    public function of(QuestLevel $level): Badge
    {
        return $this->badges->get($level->value)
            ?? throw new LogicException("The {$level->value} GAD Quest badge is missing; run the migrations.");
    }

    /**
     * Every level, Participant first, as the profile's "Still to earn" card
     * names them.
     *
     * @return list<array{level: string, name: string, image: string|null}>
     */
    public function levels(): array
    {
        return array_map(fn (QuestLevel $level): array => [
            'level' => $level->value,
            'name' => $this->of($level)->name,
            'image' => $this->of($level)->image,
        ], QuestLevel::cases());
    }
}
