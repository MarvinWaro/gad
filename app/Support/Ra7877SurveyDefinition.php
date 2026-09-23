<?php

namespace App\Support;

class Ra7877SurveyDefinition
{
    /** @return array<string, mixed> */
    public static function make(): array
    {
        return [
            'sections' => [
                [
                    'id' => 'respondent',
                    'title' => 'Respondent details',
                    'description' => 'Tell us about your demographic and institutional context. No name or email is collected.',
                    'questions' => [
                        ['id' => 'age', 'type' => 'integer', 'label' => 'Age', 'required' => true, 'min' => 1, 'max' => 120],
                        ['id' => 'sex', 'type' => 'single_select', 'label' => 'Sex', 'required' => true, 'options' => self::options(['Female', 'Male', 'Intersex', 'Prefer not to say'])],
                        // Choices come from the shared respondent-group
                        // directory, so every law offers the same list and it
                        // is maintained in one place.
                        ['id' => 'respondent_group', 'type' => 'directory_respondent_group', 'label' => 'Respondent group', 'required' => true],
                        ['id' => 'region', 'type' => 'directory_region', 'label' => 'Region', 'required' => true],
                        ['id' => 'cluster', 'type' => 'directory_cluster', 'label' => 'Cluster', 'required' => true],
                        ['id' => 'hei', 'type' => 'directory_hei', 'label' => 'Name of HEI', 'required' => true],
                    ],
                ],
                [
                    'id' => 'experiences',
                    'title' => 'Sexual harassment experiences',
                    'description' => 'Select every experience that applies. Perpetrator choices appear only for selected experiences.',
                    'questions' => [[
                        'id' => 'experiences',
                        'type' => 'experience_matrix',
                        'label' => 'Experiences',
                        'required' => true,
                        'none_option' => ['value' => 'none', 'label' => 'I have not experienced any of the above'],
                        'options' => [
                            ['value' => 'catcalling', 'label' => 'Catcalling or Wolf-whistling (Pagsipol)'],
                            ['value' => 'unwanted-invitations', 'label' => 'Unwanted invitations (Ikaw-ayang imbitasyon)'],
                            ['value' => 'discriminatory-slurs', 'label' => 'Misogynistic, Transphobic, Homophobic and Sexist slurs'],
                            ['value' => 'appearance-comments', 'label' => "Persistent unwanted comments or gestures on a person's appearance"],
                            ['value' => 'personal-details', 'label' => 'Requests for personal details (Walang humpay na pagkuha ng personal na detalye)'],
                            ['value' => 'private-images', 'label' => 'Photo or video taken of private parts (Pagkuha o pag-capture ng larawan ng private parts)'],
                            ['value' => 'groping', 'label' => 'Groping (Panghipo)'],
                        ],
                        'perpetrator_options' => [
                            ['value' => 'current-husband-partner', 'label' => 'Current Husband/Partner'],
                            ['value' => 'former-husband-partner', 'label' => 'Former Husband/Partner'],
                            ['value' => 'current-boyfriend', 'label' => 'Current Boyfriend'],
                            ['value' => 'former-boyfriend', 'label' => 'Former Boyfriend'],
                            ['value' => 'mother-stepmother', 'label' => 'Mother/Stepmother'],
                            ['value' => 'father-stepfather', 'label' => 'Father/Stepfather'],
                            ['value' => 'sister-brother', 'label' => 'Sister/Brother'],
                            ['value' => 'daughter-son', 'label' => 'Daughter/Son'],
                            ['value' => 'other-relative', 'label' => 'Other relative (Specify)', 'requires_text' => true],
                            ['value' => 'other-in-law', 'label' => 'Other-in-Law'],
                            ['value' => 'sister-in-law', 'label' => 'Sister-in-Law'],
                            ['value' => 'brother-in-law', 'label' => 'Brother-in-Law'],
                            ['value' => 'employer-work', 'label' => 'Employer/Someone at work'],
                            ['value' => 'supervisor', 'label' => 'Supervisor'],
                        ],
                    ]],
                ],
            ],
        ];
    }

    /** @param array<int, string> $labels
     * @return array<int, array{value: string, label: string}>
     */
    private static function options(array $labels): array
    {
        return array_map(fn (string $label): array => [
            'value' => str($label)->slug()->toString(),
            'label' => $label,
        ], $labels);
    }
}
