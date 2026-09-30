<?php

namespace App\Policies;

use App\Models\MonitoringReport;
use App\Models\User;

/**
 * The GAD checklists sit in the Monitoring section with the monitoring
 * report, so the report's rules decide who answers them. CHED staff see them
 * through `monitoring.view` and their office's reach.
 */
class ChecklistResponsePolicy
{
    /** HEI focal persons of an active HEI, as for starting a monitoring report. */
    public function submit(User $user): bool
    {
        return $user->can('create', MonitoringReport::class);
    }

    /** HEI focal persons see their institution's answers in Records. */
    public function viewRecords(User $user): bool
    {
        return $user->can('viewRecords', MonitoringReport::class);
    }
}
