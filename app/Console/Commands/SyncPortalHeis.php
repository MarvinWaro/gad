<?php

namespace App\Console\Commands;

use App\Services\PortalHeiSync;
use Illuminate\Console\Command;

class SyncPortalHeis extends Command
{
    protected $signature = 'surveys:sync-heis';

    protected $description = 'Sync the HEI directory from the CHEDRO XII portal';

    public function handle(PortalHeiSync $sync): int
    {
        try {
            $result = $sync->sync();
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Fetched {$result['total']} institutions from the portal.");
        $this->table(
            ['Created', 'Updated', 'Reactivated', 'Deactivated', 'Skipped'],
            [[
                $result['created'], $result['updated'], $result['reactivated'],
                $result['deactivated'], $result['skipped'],
            ]],
        );

        if ($result['clusters_created'] !== []) {
            $this->warn('New clusters created from portal provinces: '.implode(', ', $result['clusters_created']));
            $this->line('Review these under Settings > Survey directories.');
        }

        return self::SUCCESS;
    }
}
