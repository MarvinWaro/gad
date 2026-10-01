<?php

namespace App\Http\Controllers;

use App\Actions\Monitoring\SubmitChecklist;
use App\Enums\ChecklistType;
use App\Http\Requests\Monitoring\SubmitChecklistRequest;
use App\Http\Resources\ChecklistResponseResource;
use App\Models\ChecklistResponse;
use App\Models\User;
use App\Support\AcademicPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ChecklistController extends Controller
{
    /** The HEI's answer for one academic year, beside the years it answered. */
    public function show(Request $request, ChecklistType $type): Response
    {
        Gate::authorize('viewRecords', ChecklistResponse::class);
        /** @var User $user */
        $user = $request->user();
        $activeYears = AcademicPeriod::options();
        $history = ChecklistResponse::query()
            ->where('survey_hei_id', $user->survey_hei_id)
            ->where('type', $type)
            ->with(['answers:id,checklist_response_id,item_key', 'submitter:id,name'])
            ->orderByDesc('academic_year')
            ->get();
        $years = collect($activeYears)->merge($history->pluck('academic_year'))
            ->unique()->sortDesc()->values()->all();
        $year = in_array($request->query('academic_year'), $years, true)
            ? (string) $request->query('academic_year')
            : (in_array(AcademicPeriod::current()['academic_year'], $activeYears, true)
                ? AcademicPeriod::current()['academic_year'] : ($activeYears[0] ?? $years[0] ?? ''));

        return Inertia::render('monitoring/checklist', [
            'checklist' => $type->definition(),
            'academicYear' => $year,
            'academicYears' => $years,
            'history' => ChecklistResponseResource::collection($history)->resolve($request),
            'canSubmit' => $user->can('submit', ChecklistResponse::class),
        ]);
    }

    public function store(SubmitChecklistRequest $request, ChecklistType $type, SubmitChecklist $checklist): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var array{academic_year: string, items: list<string>} $data */
        $data = $request->validated();
        $checklist->handle($user, $type, $data['academic_year'], $data['items']);
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name submitted for :year.', [
            'name' => $type->label(),
            'year' => $data['academic_year'],
        ])]);

        return to_route('checklists.show', ['type' => $type, 'academic_year' => $data['academic_year']]);
    }
}
