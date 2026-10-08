<?php

namespace App\Support;

use App\Models\SurveyResponse;

/**
 * The respondent questions every survey asks besides sex assigned at birth:
 * gender identity, then sexual orientation, which is optional and never asked
 * about a minor. Gender identity is who a person is; sexual orientation is
 * whom they are attracted to, so "Heterosexual" belongs there, not among the
 * identities. Every sex answer, Intersex and Prefer not to say included, gets
 * the same identity list, and its choices never overlap (a trans man is not
 * also asked to pick "Man"). The Trans choices keep CHED's wording; the
 * others explain themselves in Filipino, since many respondents will not know
 * the English terms. The public form, the server rules, and the admin views
 * all read these lists, so the three never disagree. A respondent group's own
 * follow-up questions live on the group (see RespondentFollowUps).
 */
final class RespondentDetails
{
    private const PREFER_NOT_TO_SAY = 'Prefer not to say (Piling hindi sabihin)';

    /** Gender identity choices, the same whatever the sex answer. */
    public const GENDER_IDENTITIES = [
        'cisgender-man' => 'Cisgender Man (Lalaki, at lalaki rin noong ipinanganak)',
        'cisgender-woman' => 'Cisgender Woman (Babae, at babae rin noong ipinanganak)',
        'trans-man' => 'Trans Man (Lalaki ngunit ipinanganak sa katawan ng isang Babae)',
        'trans-woman' => 'Trans Woman (Babae ngunit ipinanganak sa katawan ng isang Lalaki)',
        'non-binary' => 'Non-binary / Gender Diverse (Hindi lamang lalaki o babae)',
        'another' => 'Another gender identity (Iba pa)',
        'prefer-not-to-say' => self::PREFER_NOT_TO_SAY,
    ];

    /** Sexual orientation choices, the same whatever the sex answer. */
    public const SEXUAL_ORIENTATIONS = [
        'heterosexual' => 'Heterosexual (Naaakit sa ibang kasarian)',
        'gay' => 'Gay (Lalaking naaakit sa kapwa lalaki)',
        'lesbian' => 'Lesbian (Babaeng naaakit sa kapwa babae)',
        'bisexual' => 'Bisexual (Naaakit sa higit sa isang kasarian)',
        'another' => 'Another sexual orientation (Iba pa)',
        'prefer-not-to-say' => self::PREFER_NOT_TO_SAY,
    ];

    /**
     * The choices, shaped for the public form's controls.
     *
     * @return array<string, list<array{value: string, label: string}>>
     */
    public static function forForm(): array
    {
        return [
            'gender_identities' => self::options(self::GENDER_IDENTITIES),
            'sexual_orientations' => self::options(self::SEXUAL_ORIENTATIONS),
        ];
    }

    /**
     * The follow-up answers a response holds, as heading => readable answer:
     * gender identity, sexual orientation, then the group's own questions.
     * Questions that were not asked or answered are left out.
     *
     * @return array<string, string>
     */
    public static function describe(SurveyResponse $response): array
    {
        $details = [];
        if ($response->gender_identity !== null) {
            $details['Gender identity'] = self::genderIdentity($response);
        }
        if ($response->sexual_orientation !== null) {
            $details['Sexual orientation'] = self::sexualOrientation($response);
        }

        return [...$details, ...RespondentFollowUps::describe($response)];
    }

    /** A response's gender identity, readable; empty when it was not answered. */
    public static function genderIdentity(SurveyResponse $response): string
    {
        if ($response->gender_identity === null) {
            return '';
        }

        return self::GENDER_IDENTITIES[$response->gender_identity] ?? $response->gender_identity;
    }

    /** A response's sexual orientation, readable; empty when not answered. */
    public static function sexualOrientation(SurveyResponse $response): string
    {
        if ($response->sexual_orientation === null) {
            return '';
        }

        return self::SEXUAL_ORIENTATIONS[$response->sexual_orientation] ?? $response->sexual_orientation;
    }

    /**
     * @param  array<string, string>  $choices
     * @return list<array{value: string, label: string}>
     */
    private static function options(array $choices): array
    {
        return array_map(
            fn (string $value, string $label): array => ['value' => $value, 'label' => $label],
            array_keys($choices),
            array_values($choices),
        );
    }
}
