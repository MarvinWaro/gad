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
    /**
     * Each office with the PSGC code of the region it covers, as HEIDA's
     * /api/regions lists them; the directory sync matches regions by it.
     * Regional Office IV covers Region IV-A (CALABARZON).
     *
     * @var array<string, string>
     */
    public const OFFICES = [
        'Regional Office I' => '0100000000',
        'Regional Office II' => '0200000000',
        'Regional Office III' => '0300000000',
        'Regional Office IV' => '0400000000',
        'Regional Office V' => '0500000000',
        'Regional Office VI' => '0600000000',
        'Regional Office VII' => '0700000000',
        'Regional Office VIII' => '0800000000',
        'Regional Office IX' => '0900000000',
        'Regional Office X' => '1000000000',
        'Regional Office XI' => '1100000000',
        'Regional Office XII' => '1200000000',
        'Regional Office CAR' => '1400000000',
        'Regional Office CARAGA' => '1600000000',
        'Regional Office MIMAROPA' => '1700000000',
        'Regional Office NCR' => '1300000000',
        'Regional Office NIR' => '1800000000',
    ];

    public function run(): void
    {
        $legacy = SurveyRegion::query()->where('name', 'Region XII')->first();
        if ($legacy !== null && ! SurveyRegion::query()->where('name', 'Regional Office XII')->exists()) {
            $legacy->update(['name' => 'Regional Office XII']);
        }

        foreach (self::OFFICES as $name => $code) {
            $region = SurveyRegion::query()->firstOrCreate(['name' => $name], ['is_active' => true]);
            if ($region->code === null) {
                $region->update(['code' => $code]);
            }
        }
    }
}
