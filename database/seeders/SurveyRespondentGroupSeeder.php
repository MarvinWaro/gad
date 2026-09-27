<?php

namespace Database\Seeders;

use App\Models\SurveyRespondentGroup;
use Illuminate\Database\Seeder;

/**
 * The respondent groups every survey offers. Administrators add, rename and
 * deactivate these under Settings > Survey directories, and write each
 * group's follow-up questions there; re-seeding never overwrites an edited
 * group.
 */
class SurveyRespondentGroupSeeder extends Seeder
{
    public function run(): void
    {
        // Students and employees answer a few follow-up questions, worded as
        // on CHED's forms; alumni none.
        $groups = [
            ['value' => 'student', 'label' => 'Student', 'questions' => [
                ['student-year', 'Student year', 'select', [
                    '1st-year' => '1st Year',
                    '2nd-year' => '2nd Year',
                    '3rd-year' => '3rd Year',
                    '4th-year' => '4th Year',
                    '5th-year' => '5th Year',
                ]],
                ['scholar', 'Are you a scholar?', 'radio', [
                    'yes' => 'Yes',
                    'no' => 'No',
                ]],
            ]],
            ['value' => 'alumni', 'label' => 'Alumni', 'questions' => []],
            ['value' => 'employee', 'label' => 'Employee', 'questions' => [
                ['unit-division', 'Unit/Division', 'select', [
                    'teaching' => 'Teaching',
                    'non-teaching' => 'Non-Teaching',
                ]],
                ['employment-status', 'Status of employment', 'select', [
                    'regular-permanent' => 'Regular/Permanent',
                    'contractual' => 'Contractual',
                ]],
            ]],
        ];

        foreach ($groups as $order => $group) {
            $record = SurveyRespondentGroup::query()->firstOrCreate(
                ['value' => $group['value']],
                [
                    'label' => $group['label'],
                    'requires_text' => false,
                    'is_active' => true,
                    'sort_order' => $order,
                ],
            );

            if (! $record->wasRecentlyCreated) {
                continue;
            }

            foreach ($group['questions'] as $questionOrder => [$key, $label, $type, $choices]) {
                $question = $record->questions()->create([
                    'key' => $key,
                    'label' => $label,
                    'type' => $type,
                    'required' => true,
                    'sort_order' => $questionOrder,
                ]);

                $optionOrder = 0;
                foreach ($choices as $value => $choice) {
                    $question->options()->create([
                        'value' => $value,
                        'label' => $choice,
                        'sort_order' => $optionOrder++,
                    ]);
                }
            }
        }
    }
}
