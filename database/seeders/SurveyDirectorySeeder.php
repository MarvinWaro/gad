<?php

namespace Database\Seeders;

use App\Models\SurveyCluster;
use App\Models\SurveyRegion;
use Illuminate\Database\Seeder;

/**
 * Reference directory for Region XII. Kept apart from SurveySeeder so the
 * survey module's feature tests can seed a survey without inheriting a
 * directory they assert the size of.
 *
 * DatabaseSeeder loads SurveyHeiSeeder after these clusters. Keeping the HEIs
 * separate lets directory feature tests build their own institution fixtures.
 */
class SurveyDirectorySeeder extends Seeder
{
    public function run(): void
    {
        $region = SurveyRegion::query()->firstOrCreate(
            ['name' => 'Region XII'],
            ['is_active' => true],
        );

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
