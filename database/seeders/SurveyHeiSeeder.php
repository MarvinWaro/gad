<?php

namespace Database\Seeders;

use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class SurveyHeiSeeder extends Seeder
{
    public function run(): void
    {
        $institutions = $this->institutions();

        DB::transaction(function () use ($institutions): void {
            $region = SurveyRegion::query()->firstOrCreate(['name' => 'Regional Office XII'], ['is_active' => true]);
            // The supplied directory has no province/cluster column. Use the
            // same fallback as portal sync instead of guessing assignments.
            $cluster = SurveyCluster::query()->firstOrCreate(
                ['survey_region_id' => $region->id, 'name' => 'Unassigned'],
                ['is_active' => true],
            );

            foreach ($institutions as $institution) {
                if (SurveyHei::query()->where('uii', $institution['uii'])->exists()) {
                    continue;
                }

                // Adopt an existing manual entry without moving it or changing
                // its ID: collected responses may already refer to that row.
                $matches = SurveyHei::query()->whereNull('uii')
                    ->whereHas('cluster', fn ($query) => $query->where('survey_region_id', $region->id))
                    ->whereRaw('LOWER(name) = ?', [Str::lower($institution['name'])])
                    ->get();

                if ($matches->count() > 1) {
                    throw new RuntimeException("Multiple manual HEIs match {$institution['uii']}; assign its UII before re-seeding.");
                }

                $existing = $matches->first();
                if ($existing !== null) {
                    $existing->update([
                        'uii' => $institution['uii'],
                        'ownership' => $existing->ownership ?? $institution['ownership'],
                    ]);

                    continue;
                }

                SurveyHei::query()->create([
                    ...$institution,
                    'survey_cluster_id' => $cluster->id,
                    'is_active' => true,
                ]);
            }
        });
    }

    /** @return list<array{uii: string, name: string, ownership: string}> */
    private function institutions(): array
    {
        $handle = fopen(__DIR__.'/data/region-xii-heis.csv', 'r');
        if ($handle === false) {
            throw new RuntimeException('Cannot read the Regional Office XII HEI seed data.');
        }

        try {
            if (fgetcsv($handle, escape: '') !== ['uii', 'name', 'type']) {
                throw new RuntimeException('Invalid Regional Office XII HEI CSV header.');
            }

            $institutions = [];
            $seen = [];
            while (($row = fgetcsv($handle, escape: '')) !== false) {
                if (count($row) !== 3) {
                    throw new RuntimeException('Each HEI seed row must contain UII, name, and type.');
                }
                [$uii, $name, $type] = array_map(trim(...), $row);
                if ($uii === '' || $name === '' || isset($seen[$uii])) {
                    throw new RuntimeException('HEI seed rows need a name and unique non-empty UII.');
                }
                $ownership = match ($type) {
                    'Private' => 'private',
                    'SUC', 'LUC' => 'public',
                    default => throw new RuntimeException("Unsupported HEI type: {$type}"),
                };
                $seen[$uii] = true;
                $institutions[] = ['uii' => $uii, 'name' => $name, 'ownership' => $ownership];
            }

            return $institutions;
        } finally {
            fclose($handle);
        }
    }
}
