<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Monitoring\ManageMonitoringReport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Monitoring\MonitoringFilterRequest;
use App\Http\Requests\Monitoring\ReviewMonitoringRequest;
use App\Http\Resources\MonitoringReportResource;
use App\Models\MonitoringReport;
use App\Models\User;
use App\Support\AcademicPeriod;
use App\Support\PlaceFilters;
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
            ->with(['currentRevision', 'region:id,name']);

        PlaceFilters::apply($reports, $filters);

        foreach (['semester', 'status'] as $field) {
            if (! empty($filters[$field])) {
                $reports->where($field, $filters[$field]);
            }
        }

        if (! empty($filters['search'])) {
            $reports->where('institution_name', 'like', '%'.$filters['search'].'%');
        }

        return Inertia::render('monitoring/records', [
            'reports' => MonitoringReportResource::collection(
                $reports->latest('updated_at')->orderBy('id')->paginate(15)->withQueryString(),
            ),
            'filters' => $filters,
            'academicYears' => AcademicPeriod::recordOptions(),
            'staff' => true,
            'canCreate' => false,
            'hasOffice' => $user->hasOffice(),
            ...PlaceFilters::options($user, $filters),
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
