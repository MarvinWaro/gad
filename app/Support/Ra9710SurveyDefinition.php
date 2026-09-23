<?php

namespace App\Support;

class Ra9710SurveyDefinition
{
    /** @return array<string, mixed> */
    public static function make(): array
    {
        $respondent = Ra7877SurveyDefinition::make()['sections'][0];

        foreach ($respondent['questions'] as $index => $question) {
            // The Magna Carta of Women addresses women, so the answer is fixed
            // rather than merely defaulted: the control ships filled in and
            // uneditable, and the server accepts no other value.
            if ($question['id'] === 'sex') {
                $respondent['questions'][$index] = [
                    'id' => 'sex', 'type' => 'single_select', 'label' => 'Sex', 'required' => true,
                    'default' => 'female', 'locked' => true,
                    'options' => [['value' => 'female', 'label' => 'Female']],
                ];
            }
        }

        return ['sections' => [$respondent, [
            'id' => 'experiences',
            'title' => 'Discrimination experiences',
            'description' => 'Which of these have you experienced in your institution? Check all that apply and specify who was responsible for each one.',
            'questions' => [[
                'id' => 'experiences', 'type' => 'experience_matrix',
                'label' => 'Discrimination experiences', 'required' => true,
                'none_option' => ['value' => 'none', 'label' => 'I have not experienced any of the above'],
                'options' => self::options([
                    'expulsion-pregnancy' => 'Expulsion due to pregnancy',
                    'restricted-services' => 'Restriction from availing of services',
                    'unequal-compensation' => 'Unequal compensation',
                    'restricted-promotions' => 'Restriction from promotions',
                    'restricted-tasks' => 'Restriction from tasks',
                    'restricted-employment' => 'Restriction from employment',
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
