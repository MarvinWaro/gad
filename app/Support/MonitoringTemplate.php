<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * CHED's GAD monitoring form, transcribed word for word from the official
 * Word template (public/assets/document/CHEDRO_XII_GAD_MONITORING _TEMPLATE_2025.docx).
 * The screen and the printable PDF both render from this definition.
 *
 * Answer keys are stored with every answer, so a published key never changes.
 * A new edition of the form gets a new version beside this one.
 */
class MonitoringTemplate
{
    public const VERSION = '2025';

    /**
     * @return array{
     *     version: string,
     *     title: string,
     *     subtitle: list<list<array{text: string, bold?: bool}>>,
     *     columns: array{requirements: string, status: string, instruction: string},
     *     labels: array{institution: string, address: string, accomplished_on: string, signature: string},
     *     signatories: list<array{key: string, role: string}>,
     *     sections: list<array{key: string, number: string, title: string, bold: bool, layout: string, detail?: string, items: list<array{key: string, label: string}>}>
     * }
     */
    public static function definition(string $version = self::VERSION): array
    {
        if ($version !== self::VERSION) {
            throw new InvalidArgumentException('Unknown monitoring template version.');
        }

        return [
            'version' => self::VERSION,
            'title' => 'Compliance to CMO No. 01, s. 2015',
            'subtitle' => [
                [['text' => '(Establishing Policies and Guidelines on Gender and Development']],
                [
                    ['text' => 'in the Commission on Higher Education and Higher Education Institutions) and '],
                    ['text' => 'R. A. 9710, Magna Carta of Women', 'bold' => true],
                ],
            ],
            'columns' => [
                'requirements' => 'REQUIREMENTS',
                'status' => 'STATUS OF COMPLIANCE',
                'instruction' => 'Please state actual situations per item.',
            ],
            'labels' => [
                'institution' => 'Name of HEI',
                'address' => 'Address',
                'accomplished_on' => 'Date Accomplished',
                'signature' => '(Name and signature)',
            ],
            'signatories' => [
                ['key' => 'president_name', 'role' => 'President'],
                ['key' => 'focal_person_name', 'role' => 'GAD Focal Person'],
            ],
            // Numbers, bold titles and layouts follow the printed form: most
            // requirements are numbered "1)" to "11)", but GEDSI is typed "12.".
            'sections' => [
                self::rows('gfps', '1)', 'Establishment and functionality of GAD Focal Point System (GFPS)', true, [
                    'gfps-membership' => 'Membership composition',
                    'gfps-policies' => 'Completion of an overall review of institution’s policies and guidelines',
                    'gfps-tasks' => 'Performance of continuing tasks (including GAD Plans and Budgets and Accomplishment Reports)',
                ]),
                self::single('plan', '2)', 'GAD Plan and Budget', 'plan-budget', 'GAD Program, Activities and Projects implemented by HEI per AY'),
                self::rows('curriculum', '3)', 'Gender-Responsive Curriculum', true, [
                    'curriculum-noted' => 'CHEDRO-noted curriculum with gender-related courses, topics, themes',
                    'curriculum-training' => 'Conduct of training in gender-responsive curriculum development',
                    'curriculum-materials' => 'Availability of pertinent learning materials and facilities (library acquisitions)',
                    'curriculum-nstp' => 'Integration of gender perspectives in NSTP curriculum',
                ]),
                self::combined('opportunity', '4)', 'Equal Opportunity Principle', [
                    'opportunity-hiring' => 'Hiring of administrators/faculty/personnel',
                    'opportunity-admission' => 'Admission of students',
                ]),
                self::rows('research', '5)', 'Gender-Responsive Research', true, [
                    'research-topics' => 'GAD-related topics and themes for research',
                ]),
                self::rows('extension', '6)', 'Gender-Responsive Extension Programs', true, [
                    'extension-inclusion' => 'Inclusion of gender equality in extension programs and activities',
                    'extension-partnerships' => 'Partnerships with organizations, HEIs',
                ]),
                self::single('gad-corner', '7)', 'GAD Corner in the HEI or GAD section in the library', 'gad-corner'),
                self::single('breastfeeding', '8)', 'Breastfeeding area', 'breastfeeding'),
                self::single('child-minding', '9)', 'Child-minding area', 'child-minding'),
                self::single('data', '10)', 'Sex-Disaggregated Data and GAD Database (enrollment, faculty and other personnel, scholars, etc.)', 'sex-disaggregated-data'),
                self::rows('harassment', '11)', 'Sexual Harassment in HEI', false, [
                    'codi' => 'Constitution and Composition of Committee on Decorum and Investigation (CODI).',
                    'complaint-reports' => 'Periodic/Regular reports of sexual harassment complaints (filed, investigated and arbitrated)',
                ]),
                self::combined('gedsi', '12.', 'Support to Gender Equality, Disability and Social Inclusion (GEDSI)', [
                    'gedsi-programs' => 'Programs for PWDs, Senior Citizens, Indigenous Peoples, Solo Parents, LGBTQA++, etc.',
                ]),
            ],
        ];
    }

    /**
     * Every answer key, in the form's order.
     *
     * @return list<string>
     */
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

    /**
     * A requirement answered in its own row.
     *
     * @return array{key: string, number: string, title: string, bold: bool, layout: string, detail?: string, items: list<array{key: string, label: string}>}
     */
    private static function single(string $key, string $number, string $title, string $answerKey, ?string $detail = null): array
    {
        $section = ['key' => $key, 'number' => $number, 'title' => $title, 'bold' => false, 'layout' => 'single'];

        if ($detail !== null) {
            $section['detail'] = $detail;
        }

        return [...$section, 'items' => [['key' => $answerKey, 'label' => $title]]];
    }

    /**
     * A heading row, then a row for each lettered item.
     *
     * @param  array<string, string>  $items
     * @return array{key: string, number: string, title: string, bold: bool, layout: string, items: list<array{key: string, label: string}>}
     */
    private static function rows(string $key, string $number, string $title, bool $bold, array $items): array
    {
        return ['key' => $key, 'number' => $number, 'title' => $title, 'bold' => $bold, 'layout' => 'rows', 'items' => self::items($items)];
    }

    /**
     * One row listing its lettered items, with an answer for each.
     *
     * @param  array<string, string>  $items
     * @return array{key: string, number: string, title: string, bold: bool, layout: string, items: list<array{key: string, label: string}>}
     */
    private static function combined(string $key, string $number, string $title, array $items): array
    {
        return ['key' => $key, 'number' => $number, 'title' => $title, 'bold' => true, 'layout' => 'combined', 'items' => self::items($items)];
    }

    /**
     * @param  array<string, string>  $items
     * @return list<array{key: string, label: string}>
     */
    private static function items(array $items): array
    {
        return array_map(
            fn (string $key, string $label): array => ['key' => $key, 'label' => $label],
            array_keys($items),
            $items,
        );
    }
}
