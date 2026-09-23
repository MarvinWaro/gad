<?php

namespace Database\Seeders;

use App\Models\SurveyRespondentGroup;
use Illuminate\Database\Seeder;

/**
 * The respondent groups every survey offers. Administrators add, rename and
 * deactivate these under Settings > Survey directories; re-seeding never
 * overwrites an edited label.
 */
class SurveyRespondentGroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            ['value' => 'student', 'label' => 'Student'],
            ['value' => 'alumni', 'label' => 'Alumni'],
            ['value' => 'employee', 'label' => 'Employee'],
        ];

        foreach ($groups as $order => $group) {
            SurveyRespondentGroup::query()->firstOrCreate(
                ['value' => $group['value']],
                [
                    'label' => $group['label'],
                    'requires_text' => false,
                    'is_active' => true,
                    'sort_order' => $order,
                ],
            );
        }
    }
}
