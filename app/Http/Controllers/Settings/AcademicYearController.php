<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Settings\ManageAcademicYear;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\SaveAcademicYearRequest;
use App\Http\Resources\AcademicYearResource;
use App\Models\AcademicYear;
use App\Models\ChecklistResponse;
use App\Models\MonitoringReport;
use App\Support\PageRange;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:9']]);
        $search = trim($filters['search'] ?? '');
        $usedLabels = MonitoringReport::query()->distinct()->pluck('academic_year')
            ->merge(ChecklistResponse::query()->distinct()->pluck('academic_year'))
            ->merge(AcademicYear::query()->whereHas('studentCounts')->pluck('label'))
            ->unique();

        return Inertia::render('settings/academic-years', [
            'academicYears' => PageRange::within(AcademicYear::query()
                ->when($search !== '', fn ($query) => $query->where('label', 'like', '%'.$search.'%'))
                ->orderByDesc('start_year')
                ->paginate(15)->withQueryString()
                ->through(fn (AcademicYear $year): array => [
                    ...AcademicYearResource::make($year)->resolve($request),
                    'has_records' => $usedLabels->contains($year->label),
                ])),
            'permissions' => [
                'create' => $request->user()->can('academic-years.create'),
                'update' => $request->user()->can('academic-years.update'),
                'delete' => $request->user()->can('academic-years.delete'),
            ],
            'filters' => ['search' => $search],
        ]);
    }

    public function store(SaveAcademicYearRequest $request, ManageAcademicYear $manager): RedirectResponse
    {
        $year = $manager->save($request->yearData());
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':year added.', ['year' => $year->label])]);

        return back();
    }

    public function update(SaveAcademicYearRequest $request, AcademicYear $academicYear, ManageAcademicYear $manager): RedirectResponse
    {
        $year = $manager->save($request->yearData(), $academicYear);
        Inertia::flash('toast', ['type' => 'success', 'message' => __(':year updated.', ['year' => $year->label])]);

        return back();
    }

    public function destroy(AcademicYear $academicYear, ManageAcademicYear $manager): RedirectResponse
    {
        $manager->delete($academicYear);
        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':year deleted.', ['year' => $academicYear->label])]);

        return back();
    }
}
