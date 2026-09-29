<?php

namespace App\Policies;

use App\Models\MonitoringReport;
use App\Models\User;

/**
 * Who may work on a monitoring report. Whether the report can still change
 * (a draft, finalized, submitted) is its workflow state, which
 * ManageMonitoringReport checks while it holds the report.
 */
class MonitoringReportPolicy
{
    /** HEI users of an active HEI, in an active cluster and region. */
    public function create(User $user): bool
    {
        return $user->hasRole('hei') && $user->hei?->is_active
            && $user->hei->cluster?->is_active && $user->hei->cluster->region?->is_active;
    }

    /** HEI users see their institution's reports in Records. */
    public function viewRecords(User $user): bool
    {
        return $user->hasRole('hei') && $user->survey_hei_id !== null;
    }

    /** Colleagues at the report's HEI share one report per period. */
    public function edit(User $user, MonitoringReport $report): bool
    {
        return $this->create($user) && $user->survey_hei_id === $report->survey_hei_id;
    }

    /** The HEI's own users, and CHED staff whose office covers its region. */
    public function view(User $user, MonitoringReport $report): bool
    {
        return ($user->hasRole('hei') && $user->survey_hei_id === $report->survey_hei_id)
            || ($user->hasPermissionTo('monitoring.view') && $user->reachesRegion($report->survey_region_id));
    }

    /** CHED reviewers whose office covers the report's region. */
    public function review(User $user, MonitoringReport $report): bool
    {
        return $user->hasPermissionTo('monitoring.review') && $user->reachesRegion($report->survey_region_id);
    }
}
