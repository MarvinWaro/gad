<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RbacSeeder::class);
        $this->call(AdminUserSeeder::class);
        // Regions before surveys, so the offices keep their canonical order
        // rather than starting with whichever one a survey needed first.
        $this->call(SurveyRegionSeeder::class);
        $this->call(SurveyRespondentGroupSeeder::class);
        $this->call(SurveySeeder::class);
        $this->call(SurveyDirectorySeeder::class);
        $this->call(SurveyHeiSeeder::class);
    }
}
