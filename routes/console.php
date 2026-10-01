<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('surveys:prune-expired')->dailyAt('02:00')->withoutOverlapping();
// Background work, such as telling every account about a new GAD event,
// goes out wherever the scheduler runs, even without a queue worker.
Schedule::command('queue:work --stop-when-empty --max-time=50')->everyMinute()->withoutOverlapping();
// CHED portal sync is paused until the portal's API base URL is confirmed.
// Re-enable by uncommenting; the command itself still runs on demand.
// Schedule::command('surveys:sync-heis')->dailyAt('03:00')->withoutOverlapping();
