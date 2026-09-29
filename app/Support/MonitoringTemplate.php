<?php

namespace App\Support;

use InvalidArgumentException;

/** Versioned transcription of the supplied monitoring template. Never change published keys or wording. */
class MonitoringTemplate
{
    public const VERSION = '2025-v3';

    public const PREVIOUS_VERSION = '2025-v2';

    public const LEGACY_VERSION = '2025-v1';

    /** @return array{version: string, title: string, subtitle: string, sections: list<array<string, mixed>>} */
    public static function definition(string $version = self::VERSION): array
    {
        if (! in_array($version, [self::VERSION, self::PREVIOUS_VERSION, self::LEGACY_VERSION], true)) {
            throw new InvalidArgumentException('Unknown monitoring template version.');
        }

        // Keep v1 exactly as it was used for already submitted revisions.
        $sections = [
            ['key' => 'gfps', 'title' => 'Establishment and functionality of GAD Focal Point System (GFPS)', 'items' => [
                ['key' => 'gfps-establishment', 'label' => 'Establishment and functionality of GAD Focal Point System (GFPS)'],
                ['key' => 'gfps-membership', 'label' => 'Membership composition'],
                ['key' => 'gfps-policies', 'label' => 'Completion of an overall review of institution’s policies and guidelines'],
                ['key' => 'gfps-tasks', 'label' => 'Performance of continuing tasks (including GAD Plans and Budgets and Accomplishment Reports)'],
            ]],
            ['key' => 'plan', 'title' => 'GAD Plan and Budget', 'items' => [
                ['key' => 'plan-budget', 'label' => 'GAD Plan and Budget', 'detail' => 'GAD Program, Activities and Projects implemented by HEI per AY'],
            ]],
            ['key' => 'curriculum', 'title' => 'Gender-Responsive Curriculum', 'items' => [
                ['key' => 'curriculum-noted', 'label' => 'CHEDRO-noted curriculum with gender-related courses, topics, themes'],
                ['key' => 'curriculum-training', 'label' => 'Conduct of training in gender-responsive curriculum development'],
                ['key' => 'curriculum-materials', 'label' => 'Availability of pertinent learning materials and facilities (library acquisitions)'],
                ['key' => 'curriculum-nstp', 'label' => 'Integration of gender perspectives in NSTP curriculum'],
            ]],
            ['key' => 'opportunity', 'title' => 'Equal Opportunity Principle', 'items' => [
                ['key' => 'opportunity', 'label' => 'Equal Opportunity Principle', 'detail' => "a. Hiring of administrators/faculty/personnel\nb. Admission of students"],
            ]],
            ['key' => 'research', 'title' => 'Gender-Responsive Research', 'items' => [
                ['key' => 'research-topics', 'label' => 'GAD-related topics and themes for research'],
            ]],
            ['key' => 'extension', 'title' => 'Gender-Responsive Extension Programs', 'items' => [
                ['key' => 'extension-inclusion', 'label' => 'Inclusion of gender equality in extension programs and activities'],
                ['key' => 'extension-partnerships', 'label' => 'Partnerships with organizations, HEIs'],
            ]],
            ['key' => 'facilities', 'title' => 'Facilities', 'items' => [
                ['key' => 'gad-corner', 'label' => 'GAD Corner in the HEI or GAD section in the library'],
                ['key' => 'breastfeeding', 'label' => 'Breastfeeding area'],
                ['key' => 'child-minding', 'label' => 'Child-minding area'],
            ]],
            ['key' => 'data', 'title' => 'Sex-Disaggregated Data and GAD Database', 'items' => [
                ['key' => 'sex-disaggregated-data', 'label' => 'Sex-Disaggregated Data and GAD Database (enrollment, faculty and other personnel, scholars, etc.)'],
            ]],
            ['key' => 'harassment', 'title' => 'Sexual Harassment  in HEI', 'items' => [
                ['key' => 'codi', 'label' => 'Constitution and Composition of Committee on Decorum and Investigation (CODI).'],
                ['key' => 'complaint-reports', 'label' => 'Periodic/Regular reports of sexual harassment complaints (filed, investigated and arbitrated)'],
            ]],
            ['key' => 'gedsi', 'title' => '12. Support to Gender Equality, Disability and Social Inclusion (GEDSI)', 'items' => [
                ['key' => 'gedsi-programs', 'label' => '12. Support to Gender Equality, Disability and Social Inclusion (GEDSI)', 'detail' => 'Programs for PWDs, Senior Citizens, Indigenous Peoples, Solo Parents, LGBTQA++, etc.'],
            ]],
        ];

        if ($version !== self::LEGACY_VERSION) {
            $numbers = ['gfps' => 1, 'plan' => 2, 'curriculum' => 3, 'opportunity' => 4, 'research' => 5, 'extension' => 6, 'data' => 10, 'harassment' => 11, 'gedsi' => 12];
            $standalone = ['plan', 'opportunity', 'data', 'gedsi'];
            $corrected = [];

            foreach ($sections as $section) {
                if ($section['key'] === 'facilities') {
                    foreach ($section['items'] as $index => $item) {
                        $corrected[] = [
                            'key' => $item['key'], 'number' => $index + 7,
                            'title' => $item['label'], 'standalone' => true,
                            'items' => [$item],
                        ];
                    }

                    continue;
                }

                if ($section['key'] === 'gfps') {
                    $section['items'] = array_slice($section['items'], 1);
                }
                if ($section['key'] === 'data') {
                    $section['title'] = $section['items'][0]['label'];
                }
                if ($section['key'] === 'gedsi') {
                    $section['title'] = substr($section['title'], 4);
                }
                if ($section['key'] === 'harassment') {
                    $section['title'] = 'Sexual Harassment in HEI';
                }

                $corrected[] = [
                    ...$section, 'number' => $numbers[$section['key']],
                    'standalone' => in_array($section['key'], $standalone, true),
                ];
            }

            $sections = $corrected;
        }

        if ($version === self::VERSION) {
            foreach ($sections as &$section) {
                if ($section['key'] === 'opportunity') {
                    $section['standalone'] = false;
                    $section['items'] = [
                        ['key' => 'opportunity-hiring', 'label' => 'Hiring of administrators/faculty/personnel'],
                        ['key' => 'opportunity-admission', 'label' => 'Admission of students'],
                    ];
                }
                if ($section['key'] === 'gedsi') {
                    $section['standalone'] = false;
                    $section['items'] = [
                        ['key' => 'gedsi-programs', 'label' => 'Programs for PWDs, Senior Citizens, Indigenous Peoples, Solo Parents, LGBTQA++, etc.'],
                    ];
                }
            }
            unset($section);
        }

        return [
            'version' => $version,
            'title' => 'Compliance to CMO No. 01, s. 2015',
            'subtitle' => '(Establishing Policies and Guidelines on Gender and Development in the Commission on Higher Education and Higher Education Institutions) and R. A. 9710, Magna Carta of Women',
            'sections' => $sections,
        ];
    }

    /** @return list<string> */
    public static function keys(string $version = self::VERSION): array
    {
        $keys = [];
        foreach (self::definition($version)['sections'] as $section) {
            foreach ($section['items'] as $item) {
                $keys[] = $item['key'];
            }
        }

        return $keys;
    }
}
