<?php

namespace App\Enums;

/**
 * The feelings a post can carry, kept short and suited to a GAD feed.
 * resources/js/lib/post-feelings.ts mirrors this list for the picker.
 */
enum PostFeeling: string
{
    case Happy = 'happy';
    case Proud = 'proud';
    case Grateful = 'grateful';
    case Excited = 'excited';
    case Inspired = 'inspired';
    case Hopeful = 'hopeful';
    case Motivated = 'motivated';
    case United = 'united';

    public function label(): string
    {
        return $this->value;
    }

    public function emoji(): string
    {
        return match ($this) {
            self::Happy => '😊',
            self::Proud => '🏅',
            self::Grateful => '🙏',
            self::Excited => '🤩',
            self::Inspired => '🌟',
            self::Hopeful => '🌷',
            self::Motivated => '💪',
            self::United => '🤝',
        };
    }
}
