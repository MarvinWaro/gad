<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ChecklistType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Monitoring\ChecklistFilterRequest;
use App\Http\Resources\ChecklistResponseResource;
use App\Models\ChecklistResponse;
use App\Models\User;
use App\Support\AcademicPeriod;
use App\Support\PlaceFilters;
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
                'cluster:id,name',
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
}
