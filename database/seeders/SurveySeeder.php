<?php

namespace Database\Seeders;

use App\Models\Survey;
use App\Models\SurveyRegion;
use App\Support\SurveyDefinitions;
use Illuminate\Database\Seeder;

class SurveySeeder extends Seeder
{
    public function run(): void
    {
        // Every questionnaire's respondent-group question reads this shared
        // directory, so the surveys cannot be seeded without it.
        $this->call(SurveyRespondentGroupSeeder::class);

        SurveyRegion::query()->firstOrCreate(['name' => 'Region XII'], ['is_active' => true]);

        $survey = Survey::query()->firstOrCreate(
            ['slug' => 'ra-7877'],
            [
                'code' => 'RA 7877',
                'title' => 'RA 7877 Survey',
                'law_title' => 'Anti-Sexual Harassment Act of 1995',
                'image_path' => '/assets/thumbnails/ra7877.jpg',
                'status' => 'active',
            ],
        );

        $survey->versions()->firstOrCreate(
            ['version' => 1],
            [
                'status' => 'draft',
                'introduction' => 'This survey gathers anonymous information about experiences related to the Anti-Sexual Harassment Act of 1995. No name or email is collected.',
                'privacy_notice' => 'CHED Regional Office XII collects age, sex, respondent group, Region, Cluster, HEI, selected experiences, perpetrator categories, and consent timestamps. These fields are used for statistical analysis and gender-responsive higher education programs. Only authorized administrators may access individual responses. You may request access to or deletion of your response using its reference code. Contact chedro12@ched.gov.ph for privacy concerns.',
                'consent_text' => 'I have read the privacy notice and voluntarily consent to the collection and processing of my survey responses for the stated purpose.',
                'retention_days' => null,
                'definition' => SurveyDefinitions::factories()['ra-7877']::make(),
            ],
        );
        $ra9262 = Survey::query()->firstOrCreate(
            ['slug' => 'ra-9262'],
            ['code' => 'RA 9262', 'title' => 'RA 9262 Survey',
                'law_title' => 'Anti-Violence Against Women and Their Children Act of 2004',
                'image_path' => '/assets/thumbnails/ra9262.jpg', 'status' => 'active'],
        );
        if (! $ra9262->versions()->exists()) {
            $ra9262->versions()->create([
                'version' => 1, 'status' => 'draft',
                'introduction' => 'Share your lived experiences so CHED Regional Office XII can craft responsive policies, referral pathways, and protection programs for women and children within HEIs. No name or email is collected. If answering for a minor under your legal care, provide the minor\'s details and experiences.',
                'privacy_notice' => 'CHED Regional Office XII collects whether you are answering for yourself or a minor under your legal care, the subject\'s age, sex, respondent group, Region, Cluster, HEI, selected experiences, perpetrator categories, specified-relative details, and consent timestamps. No name or email is collected. These responses are used for statistical analysis and gender-responsive higher education programs. Only authorized administrators may access individual responses. You may request access to or deletion of a response using its reference code. Contact chedro12@ched.gov.ph for privacy concerns.',
                'consent_text' => 'I have read the privacy notice and voluntarily consent to the collection and processing of these responses for the stated purpose. If answering for a minor, I confirm that the minor is under my legal care.',
                'retention_days' => $survey->publishedVersion()?->retention_days,
                'definition' => SurveyDefinitions::factories()['ra-9262']::make(),
            ]);
        }

        $ra9710 = Survey::query()->firstOrCreate(
            ['slug' => 'ra-9710'],
            ['code' => 'RA 9710', 'title' => 'RA 9710 Survey',
                'law_title' => 'Magna Carta of Women (Republic Act 9710)',
                'image_path' => '/assets/thumbnails/ra9710.jpg', 'status' => 'active'],
        );
        if (! $ra9710->versions()->exists()) {
            $ra9710->versions()->create([
                'version' => 1, 'status' => 'draft',
                'introduction' => 'Share how gender equality is practised in your institution so CHED Regional Office XII can strengthen protection, participation, and empowerment programmes for women learners and personnel. The Magna Carta of Women addresses discrimination against women, so this questionnaire is answered by women. No name or email is collected.',
                'privacy_notice' => 'CHED Regional Office XII collects age, respondent group, Region, Cluster, HEI, selected experiences of discrimination, the categories of those responsible, specified-relative details, and consent timestamps. Sex is recorded as female because this survey covers women only. No name or email is collected. These responses are used for statistical analysis and gender-responsive higher education programs. Only authorized administrators may access individual responses. You may request access to or deletion of your response using its reference code. Contact chedro12@ched.gov.ph for privacy concerns.',
                'consent_text' => 'I have read the privacy notice and voluntarily consent to the collection and processing of my survey responses for the stated purpose.',
                'retention_days' => $survey->publishedVersion()?->retention_days,
                'definition' => SurveyDefinitions::factories()['ra-9710']::make(),
            ]);
        }

        $ra11313 = Survey::query()->firstOrCreate(
            ['slug' => 'ra-11313'],
            ['code' => 'RA 11313', 'title' => 'RA 11313 Survey',
                'law_title' => 'Safe Spaces Act (Republic Act 11313)',
                'image_path' => '/assets/thumbnails/ra11313.jpg', 'status' => 'active'],
        );
        if (! $ra11313->versions()->exists()) {
            $ra11313->versions()->create([
                'version' => 1, 'status' => 'draft',
                'introduction' => 'Share your lived experiences so CHED Regional Office XII can better protect everyone from gender-based sexual harassment in schools, online spaces, and public areas. No name or email is collected.',
                'privacy_notice' => 'CHED Regional Office XII collects age, sex, respondent group, Region, Cluster, HEI, selected experiences, perpetrator categories, specified-relative details, where each experience took place, and consent timestamps. No name or email is collected. These responses are used for statistical analysis and gender-responsive higher education programs. Only authorized administrators may access individual responses. You may request access to or deletion of your response using its reference code. Contact chedro12@ched.gov.ph for privacy concerns.',
                'consent_text' => 'I have read the privacy notice and voluntarily consent to the collection and processing of my survey responses for the stated purpose.',
                'retention_days' => $survey->publishedVersion()?->retention_days,
                'definition' => SurveyDefinitions::factories()['ra-11313']::make(),
            ]);
        }
    }
}
