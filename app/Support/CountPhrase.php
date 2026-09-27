<?php

namespace App\Support;

use Illuminate\Support\Str;

class CountPhrase
{
    /**
     * Describe counts in words: ['post' => 3, 'comment' => 1] becomes
     * "3 posts and 1 comment". Zero counts are left out.
     *
     * @param  array<string, int>  $counts  Singular noun => count.
     */
    public static function of(array $counts): string
    {
        $parts = collect($counts)
            ->filter(fn (int $count): bool => $count > 0)
            ->map(fn (int $count, string $noun): string => number_format($count).' '.Str::plural($noun, $count))
            ->values();

        return $parts->count() > 1
            ? $parts->slice(0, -1)->implode(', ').' and '.$parts->last()
            : (string) $parts->first();
    }
}
