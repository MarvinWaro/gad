<?php

namespace App\Support;

/**
 * A short random password to email with a new account: ten letters and
 * digits, at least one of each, without the look-alikes (0 and O, 1, l and
 * I) so it can be typed from the email without guessing. Its holder replaces
 * it at their first sign-in.
 */
final class OneTimePassword
{
    public const LENGTH = 10;

    private const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    private const DIGITS = '23456789';

    public static function generate(): string
    {
        $characters = self::LETTERS.self::DIGITS;

        do {
            $password = '';
            for ($i = 0; $i < self::LENGTH; $i++) {
                $password .= $characters[random_int(0, strlen($characters) - 1)];
            }
        } while (strpbrk($password, self::DIGITS) === false || strpbrk($password, self::LETTERS) === false);

        return $password;
    }
}
