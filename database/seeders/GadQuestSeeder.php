<?php

namespace Database\Seeders;

use App\Actions\Quests\SaveQuest;
use App\Models\Quest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Seeder;
use RuntimeException;

/**
 * A starter GAD Quest on the four GAD enabling laws, for every region, left
 * as a draft for its staff to open. Each explanation quotes its Act word for
 * word: RA 7877, RA 9710 and RA 11313 from their PDFs in
 * public/assets/document, and RA 9262 Section 3 as Definition of Terms has it
 * (checked against LawPhil and ChanRobles; its file there is a brochure).
 * Seeding again leaves it alone.
 */
class GadQuestSeeder extends Seeder
{
    public const TITLE = 'GAD Laws: The Basics';

    public function run(SaveQuest $save): void
    {
        if (Quest::query()->where('title', self::TITLE)->exists()) {
            return;
        }

        $author = User::query()
            ->whereHas('roles', fn (Builder $query) => $query->where('slug', 'admin'))
            ->oldest('id')
            ->first() ?? throw new RuntimeException('Seed the administrator before the GAD Quest.');

        $save->create($author, null, [
            'title' => self::TITLE,
            'description' => 'Five easy questions on the four GAD enabling laws: RA 7877, RA 9262, RA 9710 and RA 11313.',
            'questions' => [
                [
                    'prompt' => 'RA 7877 declares sexual harassment unlawful in which settings?',
                    'explanation' => 'RA 7877, Section 2: "all forms of sexual harassment in the employment, education or training environment are hereby declared unlawful."',
                    'choices' => ['Employment, education or training environments', 'Only in government offices', 'Only inside private homes', 'Only on social media'],
                    'correct' => 0,
                ],
                [
                    'prompt' => 'A teacher asks a student for a sexual favor in exchange for a passing grade, and the student agrees. Under RA 7877, is it still sexual harassment?',
                    'explanation' => 'Yes. RA 7877, Section 3: it is committed "regardless of whether the demand, request or requirement for submission is accepted". Section 3(b)(3) names the case "When the sexual favor is made a condition to the giving of a passing grade".',
                    'choices' => ['Yes', 'No, because the student agreed'],
                    'correct' => 0,
                ],
                [
                    'prompt' => 'Under RA 9262, is controlling a woman\'s own money a form of violence against women?',
                    'explanation' => 'Yes. RA 9262, Section 3 defines economic abuse as "acts that make or attempt to make a woman financially dependent", including "controlling the victims\' own money or properties or solely controlling the conjugal money or properties."',
                    'choices' => ['Yes, it is economic abuse', 'No, it is only a private family matter'],
                    'correct' => 0,
                ],
                [
                    'prompt' => 'The Magna Carta of Women (RA 9710) defines gender equality as…',
                    'explanation' => 'RA 9710, Section 4: Gender Equality "refers to the principle asserting the equality of men and women and their right to enjoy equal conditions realizing their full human potentials to contribute to and benefit from the results of development".',
                    'choices' => ['The equality of men and women and their right to enjoy equal conditions', 'Men and women must always do the same jobs', 'Only women may benefit from development programs'],
                    'correct' => 0,
                ],
                [
                    'prompt' => 'Under RA 11313, the Safe Spaces Act, what is catcalling?',
                    'explanation' => 'RA 11313, Section 3: Catcalling "refers to unwanted remarks directed towards a person, commonly done in the form of wolf-whistling and misogynistic, transphobic, homophobic, and sexist slurs".',
                    'choices' => ['Unwanted remarks directed towards a person, such as wolf-whistling or sexist slurs', 'A compliment, so the law allows it', 'Only remarks made inside a home'],
                    'correct' => 0,
                ],
            ],
        ]);
    }
}
