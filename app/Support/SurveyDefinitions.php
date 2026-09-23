<?php

namespace App\Support;

class SurveyDefinitions
{
    /** @return array<string, class-string> */
    public static function factories(): array
    {
        return [
            'ra-7877' => Ra7877SurveyDefinition::class,
            'ra-9262' => Ra9262SurveyDefinition::class,
            'ra-9710' => Ra9710SurveyDefinition::class,
            'ra-11313' => Ra11313SurveyDefinition::class,
        ];
    }

    /** @return array<string, string> */
    public static function contract(string $slug): array
    {
        $factory = self::factories()[$slug] ?? Ra7877SurveyDefinition::class;
        $contract = [];
        foreach ($factory::make()['sections'] as $section) {
            foreach ($section['questions'] as $question) {
                $contract[$question['id']] = $question['type'];
            }
        }

        if (! isset(self::factories()[$slug])) {
            unset($contract['experiences']);
        }

        return $contract;
    }
}
