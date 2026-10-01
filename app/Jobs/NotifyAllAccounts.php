<?php

namespace App\Jobs;

use App\Enums\NotificationKind;
use App\Models\ActivityLog;
use App\Services\Notifier;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Tells every active account about one thing, such as a new GAD event. At
 * national scale that is tens of thousands of notices, so it runs in the
 * background.
 */
class NotifyAllAccounts implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public NotificationKind $kind,
        public string $activityLogId,
    ) {}

    public function handle(Notifier $notifier): void
    {
        $entry = ActivityLog::query()->find($this->activityLogId);

        // Removed again before the notices went out: there is nothing to tell.
        if ($entry === null || $entry->subject === null) {
            return;
        }

        $notifier->everyone($this->kind, $entry);
    }
}
