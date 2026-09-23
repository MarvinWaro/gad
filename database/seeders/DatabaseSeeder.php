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
        $this->call(SurveySeeder::class);
        $this->call(SurveyRespondentGroupSeeder::class);
        $this->call(SurveyDirectorySeeder::class);
        $this->call(SurveyHeiSeeder::class);
    }
}
