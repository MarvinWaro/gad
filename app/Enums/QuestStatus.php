<?php

namespace App\Enums;

/**
 * Where a GAD quest stands. Only an open quest can be played; a closed one
 * keeps its results and can open again. The codes are stored and sent to
 * the browser and the API as they are; never reuse one.
 */
enum QuestStatus: string
{
    case Draft = 'draft';
    case Open = 'open';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Open => 'Open',
            self::Closed => 'Closed',
        };
    }
}
