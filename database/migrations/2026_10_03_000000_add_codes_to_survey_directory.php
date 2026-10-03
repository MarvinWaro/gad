<?php

use Database\Seeders\SurveyRegionSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The PSGC codes HEIDA, CHED's HEI directory, gives each region and
        // province, so the directory sync matches places by code, never by
        // name (docs/heida-sync.md).
        Schema::table('survey_regions', function (Blueprint $table) {
            $table->string('code', 10)->nullable()->unique()->after('id');
        });

        // A province can sit under two regions here: the Cotabato City
        // schools stay with Regional Office XII although HEIDA files them
        // under BARMM.
        Schema::table('survey_clusters', function (Blueprint $table) {
            $table->string('code', 10)->nullable()->after('survey_region_id');
            $table->unique(['survey_region_id', 'code']);
        });

        foreach (SurveyRegionSeeder::OFFICES as $name => $code) {
            DB::table('survey_regions')->where('name', $name)->whereNull('code')->update(['code' => $code]);
        }
    }

    public function down(): void
    {
        Schema::table('survey_clusters', function (Blueprint $table) {
            $table->dropUnique(['survey_region_id', 'code']);
            $table->dropColumn('code');
        });

        Schema::table('survey_regions', function (Blueprint $table) {
            $table->dropUnique(['code']);
            $table->dropColumn('code');
        });
    }
};
