<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Support\AcademicPeriod;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    public function run(): void
    {
        foreach (AcademicPeriod::calendarOptions() as $label) {
            AcademicYear::query()->firstOrCreate(
                ['start_year' => (int) substr($label, 0, 4)],
                ['label' => $label, 'is_active' => true],
            );
        }
    }
}
