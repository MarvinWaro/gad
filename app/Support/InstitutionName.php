<?php

namespace App\Support;

/**
 * Readable casing for institution names, which the CHED directory stores in
 * capitals ("NOTRE DAME OF MARBEL UNIVERSITY" becomes "Notre Dame of Marbel
 * University"). It errs toward keeping capitals: any short word it does not
 * recognise is treated as an acronym (ACLC, AMA, STI, UPM), because a
 * lowercased acronym misnames an institution while a capitalised word does
 * not. Names that already use mixed case are returned untouched.
 */
class InstitutionName
{
    /** Words that stay lowercase inside a name. */
    private const CONNECTIVES = ['OF', 'AND', 'THE', 'DE', 'DEL', 'IN', 'FOR', 'AT'];

    /** Short words that are ordinary words, not acronyms. */
    private const SHORT_WORDS = [
        'ARTS', 'BAY', 'CITY', 'CRUZ', 'DAME', 'DATA', 'EAST', 'ERA', 'GLAN', 'GOLD',
        'HILL', 'HOLY', 'HOME', 'HOPE', 'JOHN', 'JOJI', 'JOSE', 'KING', 'LA', 'LAKE',
        'LIFE', 'LINK', 'LUZ', 'MAIN', 'MARK', 'MARY', 'NEW', 'NINO', 'PARK', 'PAUL',
        'ROSE', 'SAN', 'SEA', 'SHIP', 'STAR', 'SUN', 'VIDA', 'VIEW', 'WEST',
    ];

    /** Abbreviations with a fixed form. */
    private const ABBREVIATIONS = [
        'INC' => 'Inc', 'CO' => 'Co', 'DR' => 'Dr', 'ST' => 'St', 'STA' => 'Sta',
        'STO' => 'Sto', 'GEN' => 'Gen', 'FR' => 'Fr', 'SR' => 'Sr', 'JR' => 'Jr',
    ];

    /** Long names that are acronyms. */
    private const ACRONYMS = ['SOCSKSARGEN', 'SOCCSKSARGEN'];

    public static function display(string $name): string
    {
        $name = trim($name);

        if ($name !== mb_strtoupper($name)) {
            return $name;
        }

        $first = true;

        return (string) preg_replace_callback(
            "/\\p{L}[\\p{L}'’]*\\.?/u",
            function (array $match) use (&$first): string {
                $word = self::word($match[0], $first);
                $first = false;

                return $word;
            },
            $name,
        );
    }

    private static function word(string $token, bool $first): string
    {
        $dot = str_ends_with($token, '.') ? '.' : '';
        $word = $dot === '' ? $token : substr($token, 0, -1);
        $letters = (string) preg_replace("/['’]/u", '', $word);

        if (isset(self::ABBREVIATIONS[$word])) {
            return self::ABBREVIATIONS[$word].$dot;
        }

        if (in_array($word, self::ACRONYMS, true)) {
            return $token;
        }

        if (! $first && in_array($word, self::CONNECTIVES, true)) {
            return mb_strtolower($word).$dot;
        }

        $known = in_array($word, self::SHORT_WORDS, true) || in_array($word, self::CONNECTIVES, true);

        if (mb_strlen($letters) <= 4 && ! $known) {
            return $token;
        }

        return mb_strtoupper(mb_substr($word, 0, 1)).mb_strtolower(mb_substr($word, 1)).$dot;
    }
}
