<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database. Model events stay on, so a seeded
     * account gets its Virtual ID code and search keys from the User model,
     * as every other account does.
     */
    public function run(): void
    {
        $this->call(RbacSeeder::class);
        $this->call(AdminUserSeeder::class);
        $this->call(AcademicYearSeeder::class);
        // Regions before surveys, so the offices keep their canonical order
        // rather than starting with whichever one a survey needed first.
        $this->call(SurveyRegionSeeder::class);
        $this->call(SurveyRespondentGroupSeeder::class);
        $this->call(SurveySeeder::class);
        $this->call(SurveyDirectorySeeder::class);
        $this->call(SurveyHeiSeeder::class);
        $this->call(GadQuestSeeder::class);

        // One account per role to try the app with; never outside local.
        if (app()->environment('local')) {
            $this->call(DemoUserSeeder::class);
        }
    }
}
