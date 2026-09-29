<?php

namespace App\Http\Controllers;

use App\Actions\Monitoring\ManageMonitoringReport;
use App\Http\Requests\Monitoring\CreateMonitoringRequest;
use App\Http\Requests\Monitoring\MonitoringFilterRequest;
use App\Http\Requests\Monitoring\SaveMonitoringRequest;
use App\Http\Requests\Monitoring\SubmitMonitoringRequest;
use App\Http\Requests\Monitoring\UploadMonitoringRequest;
use App\Http\Resources\MonitoringReportResource;
use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Support\MonitoringTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MonitoringController extends Controller
{
    public function create(Request $request): Response
    {
        Gate::authorize('create', MonitoringReport::class);

        return Inertia::render('monitoring/create', ['institution' => $request->user()->hei->name]);
    }

    public function store(CreateMonitoringRequest $request, ManageMonitoringReport $action): RedirectResponse
    {
        $report = $action->create($request->user(), $request->validated());

        return to_route('monitoring.show', $report);
    }

    public function records(MonitoringFilterRequest $request): Response
    {
        abort_unless($request->user()->hasRole('hei') && $request->user()->survey_hei_id, 403);
        $filters = $request->validated();
        $reports = MonitoringReport::query()->with(['region:id,name', 'cluster:id,name'])->where('survey_hei_id', $request->user()->survey_hei_id);
        foreach (['academic_year', 'semester', 'status'] as $field) {
            if (! empty($filters[$field])) {
                $reports->where($field, $filters[$field]);
            }
        }
        if (! empty($filters['search'])) {
            $reports->where('academic_year', 'like', '%'.$filters['search'].'%');
        }

        return Inertia::render('monitoring/records', [
            'reports' => MonitoringReportResource::collection($reports->latest('updated_at')->orderBy('id')->paginate(15)->withQueryString()),
            'filters' => $filters,
            'canCreate' => $request->user()->can('create', MonitoringReport::class),
        ]);
    }

    public function show(Request $request, MonitoringReport $report): Response
    {
        Gate::authorize('view', $report);
        $report->load(['revisions.answers', 'revisions.attachment', 'revisions.reviews']);

        return Inertia::render('monitoring/show', [
            'report' => (new MonitoringReportResource($report))->resolve($request),
            'backUrl' => $request->user()->hasRole('hei') && $request->user()->survey_hei_id === $report->survey_hei_id ? '/records' : '/admin/monitoring',
        ]);
    }

    public function update(SaveMonitoringRequest $request, MonitoringReport $report, ManageMonitoringReport $action): RedirectResponse
    {
        $action->save($request->user(), $report, $request->validated());

        return back();
    }

    public function upload(UploadMonitoringRequest $request, MonitoringReport $report, ManageMonitoringReport $action): RedirectResponse
    {
        $action->upload($request->user(), $report, (int) $request->validated('lock_version'), $request->file('file'));

        return back();
    }

    public function submit(SubmitMonitoringRequest $request, MonitoringReport $report, ManageMonitoringReport $action): RedirectResponse
    {
        $action->submit($request->user(), $report, (int) $request->validated('lock_version'));

        return back();
    }

    public function attachment(MonitoringReport $report, MonitoringRevision $revision): StreamedResponse
    {
        Gate::authorize('view', $report);
        abort_unless($revision->monitoring_report_id === $report->id, 404);
        $attachment = $revision->attachment()->firstOrFail();

        return Storage::disk('monitoring')->download($attachment->path, 'monitoring-'.$report->academic_year.'-revision-'.$revision->number.'.pdf', [
            'Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function print(MonitoringReport $report, MonitoringRevision $revision): \Illuminate\Http\Response
    {
        Gate::authorize('view', $report);
        abort_unless($revision->monitoring_report_id === $report->id, 404);

        return response()->view('monitoring.print', [
            'report' => $report, 'revision' => $revision,
            'template' => MonitoringTemplate::definition($revision->template_version),
            'answers' => $revision->answers()->pluck('answer', 'requirement_key'),
        ])->header('Cache-Control', 'private, no-store');
    }
}
