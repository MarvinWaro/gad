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
use App\Models\User;
use App\Support\AcademicPeriod;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MonitoringReviewController extends Controller
{
    /** Reports from the regions the reviewer's office covers. */
    public function index(MonitoringFilterRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $reports = MonitoringReport::query()
            ->withinReachOf($user)
            ->with(['currentRevision', 'cluster:id,name', 'region:id,name']);

        foreach (['academic_year' => 'academic_year', 'semester' => 'semester', 'status' => 'status', 'region' => 'survey_region_id', 'cluster' => 'survey_cluster_id', 'hei' => 'survey_hei_id'] as $filter => $column) {
            if (! empty($filters[$filter])) {
                $reports->where($column, $filters[$filter]);
            }
        }

        if (! empty($filters['search'])) {
            $reports->where('institution_name', 'like', '%'.$filters['search'].'%');
        }

        // A regional office has one region to filter; the Central Office picks.
        $regions = SurveyRegion::query()
            ->when(! $user->national_access, fn ($query) => $query->whereKey($user->survey_region_id))
            ->orderBy('name')
            ->get(['id', 'name']);
        $regionId = $user->national_access ? (int) ($filters['region'] ?? 0) : (int) $user->survey_region_id;
        $regionId = $regions->contains('id', $regionId) ? $regionId : null;
        $clusters = $regionId
            ? SurveyCluster::query()->where('survey_region_id', $regionId)->orderBy('name')->get(['id', 'name'])
            : collect();
        $clusterId = $clusters->contains('id', (int) ($filters['cluster'] ?? 0)) ? (int) $filters['cluster'] : null;

        return Inertia::render('monitoring/records', [
            'reports' => MonitoringReportResource::collection(
                $reports->latest('updated_at')->orderBy('id')->paginate(15)->withQueryString(),
            ),
            'filters' => $filters,
            'academicYears' => AcademicPeriod::options(),
            'staff' => true,
            'canCreate' => false,
            'hasOffice' => $user->hasOffice(),
            'regions' => $regions,
            'clusters' => $clusters,
            'heis' => $clusterId
                ? SurveyHei::query()->where('survey_cluster_id', $clusterId)->orderBy('name')->get(['id', 'name'])
                : [],
        ]);
    }

    public function review(ReviewMonitoringRequest $request, MonitoringReport $report, ManageMonitoringReport $monitoring): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var array{lock_version: int, decision: string, comment?: string|null} $data */
        $data = $request->validated();
        $monitoring->review($user, $report, $data);
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $data['decision'] === 'returned'
                ? __('Returned to the HEI for correction.')
                : __('Marked as reviewed.'),
        ]);

        return back();
    }
}
