<?php

namespace App\Policies;

use App\Models\MonitoringReport;
use App\Models\User;
use App\Support\MonitoringAccess;

class MonitoringReportPolicy
{
    public function create(User $user): bool
    {
        return $user->hasRole('hei') && $user->hei?->is_active
            && $user->hei->cluster?->is_active && $user->hei->cluster->region?->is_active;
    }

    public function update(User $user, MonitoringReport $report): bool
    {
        return $this->create($user) && $user->survey_hei_id === $report->survey_hei_id
            && in_array($report->status, ['draft', 'returned'], true);
    }

    public function view(User $user, MonitoringReport $report): bool
    {
        return ($user->hasRole('hei') && $user->survey_hei_id === $report->survey_hei_id)
            || ($user->hasPermissionTo('monitoring.view') && $this->inScope($user, $report));
    }

    public function review(User $user, MonitoringReport $report): bool
    {
        return $user->hasPermissionTo('monitoring.review') && $user->hasPermissionTo('monitoring.view')
            && $this->inScope($user, $report) && $report->status === 'submitted';
    }

    private function inScope(User $user, MonitoringReport $report): bool
    {
        return MonitoringAccess::national($user) || in_array($report->survey_region_id, MonitoringAccess::regions($user), true);
    }
}
