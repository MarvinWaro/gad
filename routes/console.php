<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('surveys:prune-expired')->dailyAt('02:00')->withoutOverlapping();
Schedule::command('surveys:sync-heis')->dailyAt('03:00')->withoutOverlapping();
