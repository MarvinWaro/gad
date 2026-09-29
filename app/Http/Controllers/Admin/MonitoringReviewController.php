<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Monitoring\ManageMonitoringReport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Monitoring\MonitoringFilterRequest;
use App\Http\Requests\Monitoring\ReviewMonitoringRequest;
use App\Http\Resources\MonitoringReportResource;
use App\Models\MonitoringReport;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Support\MonitoringAccess;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringReviewController extends Controller
{
    public function index(MonitoringFilterRequest $request): Response
    {
        $user = $request->user();
        $filters = $request->validated();
        $reports = MonitoringAccess::scope(MonitoringReport::query()->with(['region:id,name', 'cluster:id,name']), $user);
        foreach (['academic_year' => 'academic_year', 'semester' => 'semester', 'status' => 'status', 'region' => 'survey_region_id', 'cluster' => 'survey_cluster_id', 'hei' => 'survey_hei_id'] as $filter => $column) {
            if (! empty($filters[$filter])) {
                $reports->where($column, $filters[$filter]);
            }
        }
        if (! empty($filters['search'])) {
            $reports->where('institution_name', 'like', '%'.$filters['search'].'%');
        }
        $regions = SurveyRegion::query()->when(! MonitoringAccess::national($user), fn ($q) => $q->whereIn('id', MonitoringAccess::regions($user)))->orderBy('name')->get(['id', 'name']);
        $regionId = in_array((int) ($filters['region'] ?? 0), $regions->pluck('id')->all(), true) ? (int) $filters['region'] : null;
        $clusters = $regionId ? SurveyCluster::query()->where('survey_region_id', $regionId)->orderBy('name')->get(['id', 'name']) : collect();
        $clusterId = in_array((int) ($filters['cluster'] ?? 0), $clusters->pluck('id')->all(), true) ? (int) $filters['cluster'] : null;

        return Inertia::render('monitoring/records', [
            'reports' => MonitoringReportResource::collection($reports->latest('updated_at')->orderBy('id')->paginate(15)->withQueryString()),
            'filters' => $filters, 'staff' => true, 'canCreate' => false,
            'assigned' => MonitoringAccess::assigned($user),
            'regions' => $regions, 'clusters' => $clusters,
            'heis' => $clusterId ? SurveyHei::query()->where('survey_cluster_id', $clusterId)->orderBy('name')->get(['id', 'name']) : [],
            'canManageAccess' => $user->can('users.update'),
        ]);
    }

    public function review(ReviewMonitoringRequest $request, MonitoringReport $report, ManageMonitoringReport $action): RedirectResponse
    {
        $action->review($request->user(), $report, $request->validated());

        return back();
    }
}
