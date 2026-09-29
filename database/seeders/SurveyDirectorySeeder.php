<?php

namespace Database\Seeders;

use App\Models\SurveyCluster;
use App\Models\SurveyRegion;
use Illuminate\Database\Seeder;

/**
 * Reference directory for Regional Office XII. Kept apart from SurveySeeder so the
 * survey module's feature tests can seed a survey without inheriting a
 * directory they assert the size of.
 *
 * DatabaseSeeder loads SurveyHeiSeeder after these clusters. Keeping the HEIs
 * separate lets directory feature tests build their own institution fixtures.
 */
class SurveyDirectorySeeder extends Seeder
{
    /** Regional Office XII's letterhead, as printed on its 2025 monitoring template. */
    public const REGION_XII_OFFICE = [
        'office_city' => 'Koronadal City',
        'office_address' => 'PRIME Government Center, Brgy. Carpenter Hill, City of Koronadal, Philippines',
        'office_email' => 'chedro12@ched.gov.ph',
        'office_website' => 'chedro12.gov.ph',
        'office_phone' => '(083) 228-7572; Tel. fax. 083-2281130',
    ];

    public function run(): void
    {
        $region = SurveyRegion::query()->firstOrCreate(
            ['name' => 'Regional Office XII'],
            ['is_active' => true],
        );

        // Fill only what is missing, so re-seeding keeps the office's own edits.
        $region->fill(array_filter(
            self::REGION_XII_OFFICE,
            fn (string $field): bool => blank($region->{$field}),
            ARRAY_FILTER_USE_KEY,
        ))->save();

        $clusters = [
            'South Cotabato',
            'Province of Cotabato',
            'Sarangani',
            'Sultan Kudarat',
        ];

        foreach ($clusters as $name) {
            SurveyCluster::query()->firstOrCreate(
                ['survey_region_id' => $region->id, 'name' => $name],
                ['is_active' => true],
            );
        }
    }
}
