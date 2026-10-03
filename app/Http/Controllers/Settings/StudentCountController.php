<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Statistics\ReplaceStudentCounts;
use App\Enums\StudentCountKind;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DeleteStudentCountsRequest;
use App\Http\Requests\Settings\ImportStudentCountsRequest;
use App\Http\Requests\Settings\StudentCountFilterRequest;
use App\Models\User;
use App\Services\StudentCountSheet;
use App\Support\AcademicPeriod;
use App\Support\PlaceFilters;
use App\Support\StudentStatistics;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Settings → Statistics → Enrollment & graduates: sex-disaggregated counts by
 * discipline group, imported from a regional office's files. See
 * docs/enrollment-and-graduates.md.
 */
class StudentCountController extends Controller
{
    public function index(StudentCountFilterRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $kind = $request->kind();
        $regionId = $request->regionId();

        return Inertia::render('settings/student-counts', [
            ...($user->hasOffice()
                ? StudentStatistics::forSettings($kind, $regionId, $request->academicYear())
                : ['academic_year' => $request->academicYear() ?? AcademicPeriod::current()['academic_year'], 'figures' => null, 'years' => [], 'academicYears' => AcademicPeriod::options()]),
            'kind' => $kind->value,
            'kinds' => array_map(fn (StudentCountKind $kind): array => ['value' => $kind->value, 'label' => $kind->label()], StudentCountKind::cases()),
            'region' => $user->national_access && $regionId !== null ? (string) $regionId : '',
            'regions' => PlaceFilters::options($user, [])['regions'],
            'hasOffice' => $user->hasOffice(),
            'nationalAccess' => $user->national_access,
            'permissions' => [
                'import' => $user->hasOffice() && $user->can('student-counts.import'),
                'delete' => $user->hasOffice() && $user->can('student-counts.delete'),
            ],
        ]);
    }

    public function import(ImportStudentCountsRequest $request, StudentCountSheet $sheet, ReplaceStudentCounts $counts): RedirectResponse
    {
        $kind = $request->kind();
        $region = $request->region();
        $file = $request->sheet();
        $result = $counts->import($kind, $region, $sheet->read($file), $file->getClientOriginalName());

        Inertia::flash('toast', ['type' => 'success', 'message' => trim(trans_choice(
            'Imported :count discipline group: :label.|Imported :count discipline groups: :label.',
            $result['groups'],
            ['label' => $counts->label($kind, $result['academic_years'], $region)],
        ).($result['new_groups'] === [] ? '' : ' '.__('New: :groups.', ['groups' => implode(', ', $result['new_groups'])])))]);

        return to_route('settings.student-counts.index', array_filter([
            'kind' => $kind->value,
            'academic_year' => $result['academic_years'][0],
            'region' => $request->user()?->national_access ? $region->id : null,
        ]));
    }

    public function template(StudentCountSheet $sheet): BinaryFileResponse
    {
        return response()
            ->download($sheet->template(AcademicPeriod::current()['academic_year']), 'enrollment-and-graduates-template.xlsx')
            ->deleteFileAfterSend();
    }

    public function destroy(DeleteStudentCountsRequest $request, ReplaceStudentCounts $counts): RedirectResponse
    {
        $kind = $request->kind();
        $region = $request->region();
        $year = $request->academicYear();
        $counts->delete($kind, $region, $year);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':label deleted.', [
            'label' => Str::ucfirst($counts->label($kind, [$year->label], $region)),
        ])]);

        return back();
    }
}
