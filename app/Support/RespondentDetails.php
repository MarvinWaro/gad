<?php

namespace App\Support;

use App\Models\SurveyResponse;

/**
 * The gender identity question every survey asks after a Female or Male
 * answer for sex, worded as on CHED's forms. The public form, the server
 * rules, and the admin views all read these lists, so the three never
 * disagree. A respondent group's own follow-up questions live on the group
 * (see RespondentFollowUps).
 */
final class RespondentDetails
{
    private const GENDER_VARIANT = 'Gender Variant/Non Conforming (Kasarian ay di umaayon sa karaniwang pamantayan)';

    private const PREFER_NOT_TO_SAY = 'Prefer not to say (Piling hindi sabihin)';

    /** Gender identity choices, keyed by the sex answer that asks for them. */
    public const GENDER_IDENTITIES = [
        'female' => [
            'heterosexual' => 'Heterosexual (Babae)',
            'trans-man' => 'Trans Man (Lalaki ngunit ipinanganak sa katawan ng isang Babae)',
            'gender-variant' => self::GENDER_VARIANT,
            'prefer-not-to-say' => self::PREFER_NOT_TO_SAY,
        ],
        'male' => [
            'heterosexual' => 'Heterosexual (Lalaki)',
            'trans-woman' => 'Trans Woman (Babae ngunit ipinanganak sa katawan ng isang Lalaki)',
            'gender-variant' => self::GENDER_VARIANT,
            'prefer-not-to-say' => self::PREFER_NOT_TO_SAY,
        ],
    ];

    /**
     * The gender identity choices for a sex answer; none for any other answer
     * (Intersex, Prefer not to say), which is not asked a follow-up.
     *
     * @return array<string, string>
     */
    public static function genderIdentities(mixed $sex): array
    {
        return is_string($sex) ? self::GENDER_IDENTITIES[$sex] ?? [] : [];
    }

    /**
     * The choices, shaped for the public form's controls.
     *
     * @return array<string, mixed>
     */
    public static function forForm(): array
    {
        $choices = [];
        foreach (self::GENDER_IDENTITIES as $sex => $identities) {
            foreach ($identities as $value => $label) {
                $choices[$sex][] = ['value' => $value, 'label' => $label];
            }
        }

        return ['gender_identities' => $choices];
    }

    /**
     * The follow-up answers a response holds, as heading => readable answer:
     * gender identity, then the group's own questions. Questions that were not
     * asked are left out.
     *
     * @return array<string, string>
     */
    public static function describe(SurveyResponse $response): array
    {
        $details = [];
        if ($response->gender_identity !== null) {
            $details['Gender identity'] = self::genderIdentity($response);
        }

        return [...$details, ...RespondentFollowUps::describe($response)];
    }

    /** A response's gender identity, readable; empty when it was not asked. */
    public static function genderIdentity(SurveyResponse $response): string
    {
        if ($response->gender_identity === null) {
            return '';
        }

        return self::genderIdentities($response->sex)[$response->gender_identity] ?? $response->gender_identity;
    }
}
