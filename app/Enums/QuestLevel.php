<?php

namespace App\Enums;

/**
 * The badge a finished quest earns. Only the highest level reached is shown,
 * so a perfect score gives one Champion badge rather than three. The codes
 * are stored and sent to the browser and the API as they are; never reuse
 * one.
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

    public function label(): string
    {
        return match ($this) {
            self::Participant => 'Participant',
            self::Advocate => 'Advocate',
            self::Champion => 'Champion',
        };
    }

    /** What the badge was given for. */
    public function meaning(): string
    {
        return match ($this) {
            self::Participant => 'Finished the quest',
            self::Advocate => 'Scored 80% or higher',
            self::Champion => 'Answered every question correctly',
        };
    }
}
