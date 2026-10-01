<?php

namespace App\Http\Controllers;

use App\Actions\Monitoring\ManageMonitoringReport;
use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Requests\Monitoring\CreateMonitoringRequest;
use App\Http\Requests\Monitoring\MonitoringFilterRequest;
use App\Http\Requests\Monitoring\MonitoringVersionRequest;
use App\Http\Requests\Monitoring\SaveMonitoringDraftRequest;
use App\Http\Requests\Monitoring\SubmitMonitoringRequest;
use App\Http\Resources\MonitoringReportResource;
use App\Http\Resources\RegionOfficeResource;
use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\AcademicPeriod;
use App\Support\MonitoringTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MonitoringController extends Controller
{
    /** Start a report for a period, or pick up one the HEI has open. */
    public function create(Request $request): Response
    {
        Gate::authorize('create', MonitoringReport::class);
        /** @var User $user */
        $user = $request->user();
        $years = AcademicPeriod::options();
        $period = AcademicPeriod::current();
        if (! in_array($period['academic_year'], $years, true)) {
            $period['academic_year'] = $years[0] ?? '';
        }

        return Inertia::render('monitoring/create', [
            'institution' => $user->hei?->name,
            'period' => $period,
            'academicYears' => $years,
            'openReports' => MonitoringReportResource::collection(
                MonitoringReport::query()
                    ->where('survey_hei_id', $user->survey_hei_id)
                    ->whereIn('status', ['draft', 'returned'])
                    ->with(['currentRevision', 'cluster:id,name', 'region:id,name'])
                    ->latest('updated_at')
                    ->limit(6)
                    ->get(),
            )->resolve($request),
        ]);
    }

    public function store(CreateMonitoringRequest $request, ManageMonitoringReport $monitoring): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $report = $monitoring->open($user, [
            'academic_year' => (string) $request->validated('academic_year'),
            'semester' => (int) $request->validated('semester'),
        ]);

        return to_route('monitoring.show', $report);
    }

    /** The institution's reports, newest activity first. */
    public function records(MonitoringFilterRequest $request): Response
    {
        Gate::authorize('viewRecords', MonitoringReport::class);
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $reports = MonitoringReport::query()
            ->where('survey_hei_id', $user->survey_hei_id)
            ->with(['currentRevision', 'cluster:id,name', 'region:id,name']);

        foreach (['academic_year', 'semester', 'status'] as $field) {
            if (! empty($filters[$field])) {
                $reports->where($field, $filters[$field]);
            }
        }

        return Inertia::render('monitoring/records', [
            'reports' => MonitoringReportResource::collection(
                $reports->latest('updated_at')->orderBy('id')->paginate(15)->withQueryString(),
            ),
            'filters' => $filters,
            'academicYears' => AcademicPeriod::recordOptions(),
            'canCreate' => $user->can('create', MonitoringReport::class),
        ]);
    }

    public function show(Request $request, MonitoringReport $report): Response
    {
        Gate::authorize('view', $report);
        /** @var User $user */
        $user = $request->user();
        $report->load([
            'currentRevision',
            'cluster:id,name',
            'region',
            'revisions' => fn ($query) => $query->with([
                'answers', 'attachment', 'reviews', 'finalizer:id,name', 'submitter:id,name',
            ]),
        ]);

        return Inertia::render('monitoring/show', [
            'report' => MonitoringReportResource::make($report)->resolve($request),
            // Every edition of the form this report's revisions were written on.
            'templates' => $report->revisions->pluck('template_version')->unique()->mapWithKeys(
                fn (string $version): array => [$version => MonitoringTemplate::definition($version)],
            ),
            'office' => RegionOfficeResource::make($report->region)->resolve($request),
            // The report's own HEI works on it; anyone else here is CHED staff.
            'viewer' => $user->can('viewRecords', MonitoringReport::class) && $user->survey_hei_id === $report->survey_hei_id
                ? 'hei'
                : 'staff',
        ]);
    }

    /** Autosave: JSON, so the form keeps its place while the answers save. */
    public function saveDraft(SaveMonitoringDraftRequest $request, MonitoringReport $report, ManageMonitoringReport $monitoring): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json($monitoring->saveDraft($user, $report, $request->changes()));
    }

    public function finalize(MonitoringVersionRequest $request, MonitoringReport $report, ManageMonitoringReport $monitoring): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $monitoring->finalize($user, $report, $request->version());
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Finalized. Download the PDF, sign it, and upload the signed copy.')]);

        return back();
    }

    public function reopen(MonitoringVersionRequest $request, MonitoringReport $report, ManageMonitoringReport $monitoring): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $monitoring->reopen($user, $report, $request->version());
        Inertia::flash('toast', ['type' => 'info', 'message' => __('The answers can be edited again. Finalize and print a new copy when you are done.')]);

        return back();
    }

    public function submit(SubmitMonitoringRequest $request, MonitoringReport $report, ManageMonitoringReport $monitoring): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $monitoring->submit($user, $report, $request->version(), $request->signedCopy());
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Submitted to CHED for review.')]);

        return back();
    }

    /** A submitted revision's signed copy: shown in the browser, or downloaded. */
    public function attachment(Request $request, MonitoringReport $report, MonitoringRevision $revision, ActivityRecorder $activity): StreamedResponse
    {
        Gate::authorize('view', $report);
        abort_unless($revision->monitoring_report_id === $report->id, 404);
        $attachment = $revision->attachment()->firstOrFail();
        $name = 'GAD-Monitoring-Report_'.$report->academic_year.'_S'.$report->semester.'_Rev'.$revision->number.'_signed.pdf';
        $headers = [
            'Content-Type' => 'application/pdf',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ];

        if (! $request->boolean('inline')) {
            $activity->record(ActivityAction::Downloaded, ActivityModule::Monitoring, $report, properties: [
                'revision' => $revision->number,
                'file' => 'signed copy',
            ]);
        }

        return $request->boolean('inline')
            ? Storage::disk('monitoring')->response($attachment->path, $name, $headers + ['X-Frame-Options' => 'SAMEORIGIN'])
            : Storage::disk('monitoring')->download($attachment->path, $name, $headers);
    }
}
