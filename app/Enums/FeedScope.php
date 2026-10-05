<?php

namespace App\Enums;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Which posts the Gender Mainstreaming feed shows: everyone's, only those of
 * the reader's own region, or only those of the people the reader follows.
 * Sent as `?feed=`; the codes are stable.
 */
enum FeedScope: string
{
    case All = 'all';
    case Region = 'region';
    case Following = 'following';

    /** @return list<mixed> The `feed` field's validation. */
    public static function rules(): array
    {
        return ['nullable', Rule::enum(self::class)];
    }

    /**
     * The scope a validated request asks for; everyone's when it asks none,
     * or asks for a region the reader does not have (the Central Office).
     */
    public static function of(Request $request): self
    {
        $scope = self::tryFrom($request->string('feed')->toString()) ?? self::All;
        $reader = $request->user();

        return $scope === self::Region && ! ($reader instanceof User && $reader->regionId() !== null) ? self::All : $scope;
    }
}
