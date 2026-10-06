<?php

namespace App\Enums;

/**
 * The badge a finished quest earns. Only the highest level reached is shown,
 * so a perfect score gives one Champion badge rather than three. Each level's
 * name, description and picture are its row in `badges`, edited in Settings →
 * Badges (App\Support\QuestBadges). The codes are stored and sent to the
 * browser and the API as they are; never reuse one.
 */
enum QuestLevel: string
{
    case Participant = 'participant';
    case Advocate = 'advocate';
    case Champion = 'champion';

    /** The share of correct answers an Advocate badge needs. */
    public const ADVOCATE_SHARE = 0.8;

    public static function fromScore(int $correct, int $total): self
    {
        return match (true) {
            $total > 0 && $correct >= $total => self::Champion,
            $total > 0 && $correct / $total >= self::ADVOCATE_SHARE => self::Advocate,
            default => self::Participant,
        };
    }

    /**
     * The level as SQL, for counting in the database: fromScore() over two
     * numeric expressions, such as column names. It takes literal strings
     * only, as raw SQL does, so user input never reaches it.
     *
     * @param  literal-string  $correct
     * @param  literal-string  $total
     * @return literal-string
     */
    public static function sql(string $correct, string $total): string
    {
        return "case when {$total} > 0 and {$correct} >= {$total} then '".self::Champion->value."'"
            ." when {$total} > 0 and {$correct} >= {$total} * ".self::ADVOCATE_SHARE." then '".self::Advocate->value."'"
            ." else '".self::Participant->value."' end";
    }

    /** How it is earned, as Settings → Badges says it. */
    public function criterion(): string
    {
        return match ($this) {
            self::Participant => 'Finishing a GAD Quest',
            self::Advocate => sprintf('Scoring %d%% or more in a GAD Quest', self::ADVOCATE_SHARE * 100),
            self::Champion => 'Every answer right in a GAD Quest',
        };
    }

    /** Whether it is a higher badge than another: a replay that levels up. */
    public function isAbove(self $other): bool
    {
        $order = self::cases();

        return array_search($this, $order, true) > array_search($other, $order, true);
    }
}
