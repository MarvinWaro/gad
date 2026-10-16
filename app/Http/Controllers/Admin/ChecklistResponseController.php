<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ChecklistType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Monitoring\ChecklistFilterRequest;
use App\Http\Resources\ChecklistResponseResource;
use App\Http\Resources\SubmissionGapResource;
use App\Models\ChecklistResponse;
use App\Models\User;
use App\Support\AcademicPeriod;
use App\Support\PlaceFilters;
use App\Support\SubmissionGaps;
use Inertia\Inertia;
use Inertia\Response;

class ChecklistResponseController extends Controller
{
    /** HEIs' answers from the regions the staff account's office covers. */
    public function index(ChecklistFilterRequest $request, ChecklistType $type): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $responses = ChecklistResponse::query()
            ->withinReachOf($user)
            ->where('type', $type)
            ->with([
                'answers:id,checklist_response_id,item_key',
                'submitter:id,name',
                'hei:id,name',
                'region:id,name',
            ]);
        PlaceFilters::apply($responses, $filters);

        if (! empty($filters['search'])) {
            $responses->whereHas('hei', fn ($query) => $query->where('name', 'like', '%'.$filters['search'].'%'));
        }

        return Inertia::render('monitoring/checklist-responses', [
            'checklist' => $type->definition(),
            'responses' => ChecklistResponseResource::collection(
                $responses->latest('submitted_at')->orderBy('id')->paginate(15)->withQueryString(),
            ),
            'filters' => $filters,
            'academicYears' => AcademicPeriod::recordOptions(),
            'hasOffice' => $user->hasOffice(),
            ...PlaceFilters::options($user, $filters),
        ]);
    }

    /** The institutions with no answer for an academic year (the current one unless chosen). */
    public function notSubmitted(ChecklistFilterRequest $request, ChecklistType $type): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $academicYear = $filters['academic_year'] ?? AcademicPeriod::current()['academic_year'];

        return Inertia::render('monitoring/not-submitted', [
            'subject' => ['kind' => 'checklist', 'type' => $type->value, 'title' => $type->label(), 'noun' => $type->label()],
            'gaps' => SubmissionGapResource::collection(SubmissionGaps::checklists($user, $type, $filters, $academicYear)),
            'filters' => $filters,
            'period' => ['academic_year' => $academicYear, 'semester' => null],
            'academicYears' => AcademicPeriod::recordOptions(),
            'hasOffice' => $user->hasOffice(),
            ...PlaceFilters::options($user, $filters),
        ]);
    }
}
