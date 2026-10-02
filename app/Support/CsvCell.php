<?php

namespace App\Support;

/** Text typed by the public, made safe to open in a spreadsheet. */
class CsvCell
{
    /**
     * A cell that a spreadsheet would run as a formula (=, +, -, @, or a
     * leading tab or return) is prefixed with an apostrophe.
     */
    public static function safe(?string $value): string
    {
        $value ??= '';

        return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'".$value : $value;
    }
}
