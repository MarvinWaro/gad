<?php

namespace App\Support;

class Ra9262SurveyDefinition
{
    /** @return array<string, mixed> */
    public static function make(): array
    {
        $respondent = Ra7877SurveyDefinition::make()['sections'][0];
        array_unshift($respondent['questions'], [
            'id' => 'answering_for', 'type' => 'single_select',
            'label' => 'Are you answering for yourself or for a minor under your legal care?',
            'required' => true,
            'options' => [
                ['value' => 'self', 'label' => 'Myself'],
                ['value' => 'minor-under-legal-care', 'label' => 'Minor under my legal care'],
            ],
        ]);

        return ['sections' => [$respondent, [
            'id' => 'experiences',
            'title' => 'Violence Experiences',
            'description' => 'Which of these violences have you experienced? Check all that apply and specify the perpetrators for each one.',
            'questions' => [[
                'id' => 'experiences', 'type' => 'experience_matrix', 'label' => 'Violence Experiences', 'required' => true,
                'none_option' => ['value' => 'none', 'label' => 'I have not experienced any of the above'],
                'options' => self::options([
                    'physical-violence' => 'Physical Violence (Pisikal na Karahasan)',
                    'battery' => 'Battery (Pananakit)',
                    'fear-of-physical-harm' => 'Placing the victim in fear of imminent physical harm (Pagtatakot)',
                    'attempted-physical-harm' => 'Attempting to cause physical harm (Pagtangka)',
                    'sexual-violence' => 'Sexual Violence (Sekswal na Karahasan)',
                    'acts-of-lasciviousness' => 'Acts of Lasciviousness (Panliligalig)',
                    'sexual-remarks' => 'Demeaning and sexually suggestive remarks (Pambabastos at malaswang pananalita)',
                    'sexual-body-attacks' => "Physically attacking the sexual parts of the victim's body",
                    'forced-obscene-material' => 'Forcing the victim to watch obscene publications or indecent shows',
                    'forced-conjugal-cohabitation' => 'Forcing the wife and mistress/lover to live in the conjugal home',
                    'forced-sexual-activity' => 'Causing or attempting to cause the victim to engage in sexual activity through force or intimidation',
                    'psychological-violence' => 'Psychological Violence (Sikolohikal na Karahasan)',
                    'emotional-anguish' => 'Causing or threatening serious emotional anguish to the woman or her child',
                    'public-humiliation' => 'Public ridicule or humiliation (Paglantad sa publiko)',
                    'witnessing-family-abuse' => 'Causing or allowing the victim to witness abuse of a family member',
                    'stalking' => 'Stalking or persistent unwanted surveillance (Pangunguntit at paniniktik)',
                    'cyber-harassment' => 'Cyber harassment or online abuse',
                    'economic-abuse' => 'Economic Abuse (Pinansyal na Pang-aabuso)',
                    'employment-control' => 'Controlling the woman from engaging in legitimate profession or employment',
                    'financial-control' => "Controlling the woman's money or properties (Pag-aagaw sa kinikita o pag-aari)",
                    'property-destruction' => 'Destroying household or personal property',
                ]),
                'perpetrator_options' => array_map(
                    fn (array $option): array => $option['value'] === 'other-relative' ? [...$option, 'requires_text' => true] : $option,
                    self::options([
                        'current-husband-partner' => 'Current Husband/Partner',
                        'former-husband-partner' => 'Former Husband/Partner',
                        'current-boyfriend' => 'Current Boyfriend',
                        'former-boyfriend' => 'Former Boyfriend',
                        'mother-stepmother' => 'Mother/Stepmother',
                        'father-stepfather' => 'Father/Stepfather',
                        'sister-brother' => 'Sister/Brother',
                        'daughter-son' => 'Daughter/Son',
                        'other-relative' => 'Other Relative (Specify)',
                        'mother-in-law' => 'Mother-in-Law',
                        'father-in-law' => 'Father-in-Law',
                        'sister-in-law' => 'Sister-in-Law',
                        'brother-in-law' => 'Brother-in-Law',
                        'teacher' => 'Teacher',
                        'employee-work' => 'Employee/Someone at work',
                        'superior-supervisor' => 'Superior/Supervisor',
                    ]),
                ),
            ]],
        ]]];
    }

    /** @param array<string, string> $choices
     * @return list<array{value: string, label: string}>
     */
    private static function options(array $choices): array
    {
        $options = [];
        foreach ($choices as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        return $options;
    }
}
