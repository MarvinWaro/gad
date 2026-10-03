<?php

namespace App\Enums;

/**
 * What a sex-disaggregated student count counts. The codes are stored and
 * sent to the browser and the API as they are; never reuse one.
 */
enum StudentCountKind: string
{
    case Enrollment = 'enrollment';
    case Graduates = 'graduates';

    public function label(): string
    {
        return match ($this) {
            self::Enrollment => 'Enrollment',
            self::Graduates => 'Graduates',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
