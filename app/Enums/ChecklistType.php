<?php

namespace App\Enums;

/**
 * The two yearly checklists an HEI answers besides its monitoring report.
 * Titles, instructions and items are the old PHLGADIS modals' text word for
 * word (from screenshots of phlgadis.chedro12.com/gender_mainstreaming, which
 * needs a login, taken 2026-09-30), in the order the modals list them. The
 * item keys are stable codes for storage and the API; never reuse one for
 * different wording.
 */
enum ChecklistType: string
{
    case Training = 'training';
    case Compliance = 'compliance';

    /** The name the HEI's quick links and the Records tabs use. */
    public function label(): string
    {
        return match ($this) {
            self::Training => 'GAD Training Survey',
            self::Compliance => 'GAD Compliance Survey',
        };
    }

    public function title(): string
    {
        return match ($this) {
            self::Training => 'GAD Related Trainings',
            self::Compliance => 'Implementing Rules and Regulations on Gender-Based Sexual Harassment in Higher Education Institutions',
        };
    }

    public function instruction(): string
    {
        return match ($this) {
            self::Training => 'Please check any of the GAD trainings, conference, or seminars you have attended',
            self::Compliance => 'Please check all the implementations that your institution have complied with',
        };
    }

    /** @return array<string, string> item key => label */
    public function items(): array
    {
        return match ($this) {
            self::Training => [
                'gender-sensitivity' => 'Gender Sensitivity Training',
                'gad-plan-budget-report' => 'Preparation of GAD Plan and Budget and Accomplishment Report',
                'gad-agenda' => 'Preparation of GAD Agenda',
                'gender-related-law' => 'Orientation on Gender-related Law',
                'hgdg-project-evaluation' => 'Project Evaluation using Harmonized Gender and Development Guidelines',
                'sexual-harassment-cases' => 'Proper handling of sexual harassment cases',
                'gmef-institutional-evaluation' => 'Institutional Evaluation using Gender Mainstreaming and Evaluation Framework',
                'sex-disaggregated-data' => 'Collection of sex disaggregated data',
            ],
            self::Compliance => [
                'codi' => 'Existence and Implementation of Committee on Decorum and Investigation',
                'code-of-conduct' => 'Existence of a Code of Conduct that defines Gender Based Sexual Harassment',
                'materials-premises' => 'Materials and Infographics about Gender Based Sexual Harassment posted in the premises of the institution',
                'materials-website' => 'Materials and Infographics about Gender Based Sexual Harassment posted in the HEI website',
                'materials-social-media' => 'Materials and Infographics about Gender Based Sexual Harassment posted in the social media accounts of the institution',
                'ra7877-student-organizations' => 'Conduct orientations about Anti-Sexual Harassment Act (RA 7877) on student organizations',
                'ra11313-student-organizations' => 'Conduct orientations about Safe Spaces Act (RA 11313), on student organizations',
                'ra7877-students' => 'Conduct orientations about Anti-Sexual Harassment Act (RA 7877) on students',
                'ra7877-faculty-staff' => 'Conduct orientations about Anti-Sexual Harassment Act (RA 7877) on faculties and staff',
                'ra11313-faculty-staff' => 'Conduct orientations about Safe Spaces Act (RA 11313), on faculties and staff',
                'gad-seminars-faculty-staff' => 'Conduct compliances and seminars about Gender and Development on faculties and staff',
                'gender-resource-center' => 'Existence and Implementation of Gender Resource Center',
            ],
        };
    }

    /**
     * The checklist as pages show it.
     *
     * @return array{type: string, name: string, title: string, instruction: string, items: list<array{key: string, label: string}>}
     */
    public function definition(): array
    {
        return [
            'type' => $this->value,
            'name' => $this->label(),
            'title' => $this->title(),
            'instruction' => $this->instruction(),
            'items' => array_map(
                fn (string $key, string $label): array => ['key' => $key, 'label' => $label],
                array_keys($this->items()),
                $this->items(),
            ),
        ];
    }
}
