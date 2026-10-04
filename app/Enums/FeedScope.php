<?php

namespace App\Enums;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Which posts the Gender Mainstreaming feed shows: everyone's, or only those
 * of the people the reader follows. Sent as `?feed=`; the codes are stable.
 */
enum FeedScope: string
{
    case All = 'all';
    case Following = 'following';

    /** @return list<mixed> The `feed` field's validation. */
    public static function rules(): array
    {
        return ['nullable', Rule::enum(self::class)];
    }

    /** The scope a validated request asks for; everyone's when it asks none. */
    public static function of(Request $request): self
    {
        return self::tryFrom($request->string('feed')->toString()) ?? self::All;
    }
}
