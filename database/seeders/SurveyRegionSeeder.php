<?php

namespace Database\Seeders;

use App\Models\SurveyRegion;
use Illuminate\Database\Seeder;

/**
 * The CHED regional offices respondents choose from.
 *
 * An earlier seed named the Region XII row "Region XII"; it is renamed rather
 * than duplicated so the clusters and HEIs already hanging off it keep their
 * parent, and so responses referencing them stay intact.
 */
class SurveyRegionSeeder extends Seeder
{
    /** @var list<string> */
    public const OFFICES = [
        'Regional Office I',
        'Regional Office II',
        'Regional Office III',
        'Regional Office IV',
        'Regional Office V',
        'Regional Office VI',
        'Regional Office VII',
        'Regional Office VIII',
        'Regional Office IX',
        'Regional Office X',
        'Regional Office XI',
        'Regional Office XII',
        'Regional Office CAR',
        'Regional Office CARAGA',
        'Regional Office MIMAROPA',
        'Regional Office NCR',
        'Regional Office NIR',
    ];

    public function run(): void
    {
        $legacy = SurveyRegion::query()->where('name', 'Region XII')->first();
        if ($legacy !== null && ! SurveyRegion::query()->where('name', 'Regional Office XII')->exists()) {
            $legacy->update(['name' => 'Regional Office XII']);
        }

        foreach (self::OFFICES as $name) {
            SurveyRegion::query()->firstOrCreate(['name' => $name], ['is_active' => true]);
        }
    }
}
