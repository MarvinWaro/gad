<?php

namespace App\Support;

class Ra11313SurveyDefinition
{
    /** @return array<string, mixed> */
    public static function make(): array
    {
        $respondent = Ra7877SurveyDefinition::make()['sections'][0];

        foreach ($respondent['questions'] as $index => $question) {
            // The Safe Spaces Act questionnaire offers two choices for sex.
            if ($question['id'] === 'sex') {
                $respondent['questions'][$index] = [
                    'id' => 'sex', 'type' => 'single_select', 'label' => 'Sex', 'required' => true,
                    'options' => self::options([
                        'female' => 'Female',
                        'male' => 'Male',
                    ]),
                ];
            }
        }

        return ['sections' => [$respondent, [
            'id' => 'experiences',
            'title' => 'Sexual harassment experiences',
            'description' => 'Which of these have you experienced? Check all that apply and specify who was responsible for each one.',
            'questions' => [
                [
                    'id' => 'experiences', 'type' => 'experience_matrix',
                    'label' => 'Sexual harassment experiences', 'required' => true,
                    'none_option' => ['value' => 'none', 'label' => 'I have not experienced any of the above'],
                    'options' => self::options([
                        'catcalling' => 'Catcalling or Wolf-whistling (Pagsipol)',
                        'unwanted-invitations' => 'Unwanted invitations (Di kayang-ayang imbitasyon)',
                        'discriminatory-slurs' => 'Misogynistic, Transphobic, Homophobic and Sexist slurs',
                        'appearance-comments' => "Persistent unwanted comments or gestures on a person's appearance",
                        'personal-details' => 'Requests for personal details (Walang humpay na paghingi ng personal na detalye)',
                        'private-images' => 'Photo or video taken of private parts (Pagkuha o pag capture ng larawan ng private parts)',
                        'groping' => 'Groping (Panghipo)',
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
                            'other-relative' => 'Other relative (Specify)',
                            'other-in-law' => 'Other-in-Law',
                            'sister-in-law' => 'Sister-in-Law',
                            'brother-in-law' => 'Brother-in-Law',
                            'teacher' => 'Teacher',
                            'employee-work' => 'Employee/Someone at work',
                            'superior-supervisor' => 'Superior/Supervisor',
                        ]),
                    ),
                ],
                [
                    // What the Safe Spaces Act adds over RA 7877: the law covers
                    // streets, public spaces and online, so where it happened is
                    // collected as well as what happened.
                    'id' => 'locations', 'type' => 'multi_select',
                    'label' => 'Where did you experience these sexual harassments?',
                    'required' => true,
                    'options' => self::options([
                        'school' => 'School',
                        'church' => 'Church',
                        'restaurant' => 'Restaurant',
                        'mall' => 'Mall',
                        'transportation-terminal' => 'Transportation Terminal',
                        'public-utility-vehicle' => 'Public Utility Vehicle',
                        'online' => 'Online',
                    ]),
                ],
            ],
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
