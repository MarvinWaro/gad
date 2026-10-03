<?php

namespace App\Console\Commands;

use App\Services\HeidaDirectorySync;
use Illuminate\Console\Command;

class SyncHeis extends Command
{
    protected $signature = 'surveys:sync-heis {--dry-run : Show what would change without saving anything}';

    protected $description = "Copy the regions and HEIs from HEIDA, CHED's HEI directory";

    public function handle(HeidaDirectorySync $sync): int
    {
        $dryRun = (bool) $this->option('dry-run');

        try {
            $result = $sync->sync($dryRun);
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Fetched {$result['total']} institutions from HEIDA in {$result['calls']} requests.");
        $this->table(
            ['Added', 'Updated', 'Restored', 'Deactivated', 'Skipped'],
            [[
                $result['created'], $result['updated'], $result['reactivated'],
                $result['deactivated'], $result['skipped'],
            ]],
        );

        if ($result['regions_created'] !== []) {
            $this->warn('New regions from HEIDA: '.implode(', ', $result['regions_created']));
        }
        if ($dryRun) {
            $this->warn('Dry run: nothing was saved.');
        }

        return self::SUCCESS;
    }
}
