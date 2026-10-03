<?php

namespace App\Jobs;

use App\Services\HeidaDirectorySync;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * The HEIDA directory sync, started from Settings. Its 27 or so calls to
 * HEIDA, paused between pages, take longer than a web request should.
 */
class SyncHeidaDirectory implements ShouldQueue
{
    use Queueable;

    /** One try: a failed sync waits for the next night rather than hitting HEIDA again. */
    public int $tries = 1;

    public int $timeout = 600;

    public function handle(HeidaDirectorySync $sync): void
    {
        $sync->sync();
    }
}
