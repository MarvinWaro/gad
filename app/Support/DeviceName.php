<?php

namespace App\Support;

/**
 * A browser's user agent as people say it: "Chrome on Windows 10/11". Only
 * the common browsers and systems are told apart; anything else is
 * "Unknown browser". Windows 10 and 11 send the same user agent.
 */
class DeviceName
{
    /** Checked in order: Edge, Opera and Samsung Internet also say Chrome. */
    private const BROWSERS = [
        'Edg/' => 'Edge',
        'OPR/' => 'Opera',
        'SamsungBrowser/' => 'Samsung Internet',
        'Firefox/' => 'Firefox',
        'FxiOS/' => 'Firefox',
        'CriOS/' => 'Chrome',
        'Chrome/' => 'Chrome',
        'Safari/' => 'Safari',
    ];

    /** Checked in order: Android also says Linux, and iPadOS can say Mac. */
    private const SYSTEMS = [
        'Windows NT 10.0' => 'Windows 10/11',
        'Windows NT 6.3' => 'Windows 8.1',
        'Windows NT 6.1' => 'Windows 7',
        'Windows' => 'Windows',
        'Android' => 'Android',
        'iPhone' => 'iPhone',
        'iPad' => 'iPad',
        'Mac OS X' => 'macOS',
        'CrOS' => 'ChromeOS',
        'Linux' => 'Linux',
    ];

    public static function from(?string $userAgent): ?string
    {
        if ($userAgent === null || $userAgent === '') {
            return null;
        }

        $browser = self::first(self::BROWSERS, $userAgent) ?? 'Unknown browser';
        $system = self::first(self::SYSTEMS, $userAgent);

        return $system === null ? $browser : "{$browser} on {$system}";
    }

    /** @param array<string, string> $names */
    private static function first(array $names, string $userAgent): ?string
    {
        foreach ($names as $needle => $name) {
            if (str_contains($userAgent, $needle)) {
                return $name;
            }
        }

        return null;
    }
}
