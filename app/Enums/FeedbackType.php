<?php

namespace App\Enums;

/**
 * What a visitor's website feedback is, as the old PHLGADIS feedback form
 * asked it. The codes are stored and exchanged; the labels are the form's
 * own wording (see App\Support\FeedbackQuestions).
 */
enum FeedbackType: string
{
    case Comment = 'comment';
    case Question = 'question';
    case Bug = 'bug';
    case Feature = 'feature';

    public function label(): string
    {
        return match ($this) {
            self::Comment => 'Comments/Recommendations',
            self::Question => 'Questions',
            self::Bug => 'Bug Reports',
            self::Feature => 'Feature Request',
        };
    }

    /** @return list<array{code: string, label: string}> */
    public static function options(): array
    {
        return array_map(
            fn (self $type): array => ['code' => $type->value, 'label' => $type->label()],
            self::cases(),
        );
    }
}
