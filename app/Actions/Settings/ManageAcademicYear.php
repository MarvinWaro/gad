<?php

namespace App\Actions\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\AcademicYear;
use App\Models\ChecklistResponse;
use App\Models\MonitoringReport;
use App\Services\ActivityRecorder;
use App\Support\AcademicPeriod;
use Illuminate\Validation\ValidationException;

class ManageAcademicYear
{
    public function __construct(private readonly ActivityRecorder $activity) {}

    /** @param array{start_year: int, is_active?: bool} $data */
    public function save(array $data, ?AcademicYear $year = null): AcademicYear
    {
        $year ??= new AcademicYear;
        $label = AcademicPeriod::label((int) $data['start_year']);

        if ($year->exists && $year->label !== $label && $this->isUsed($year)) {
            throw ValidationException::withMessages([
                'start_year' => __('This academic year has records. You can change its status, but not its year.'),
            ]);
        }

        $year->fill([
            'start_year' => $data['start_year'],
            'label' => $label,
            'is_active' => $data['is_active'] ?? true,
        ])->save();
        $this->activity->recordSave(ActivityModule::AcademicYears, $year);

        return $year;
    }

    public function delete(AcademicYear $year): void
    {
        if ($this->isUsed($year)) {
            throw ValidationException::withMessages([
                'academic_year' => __('This academic year has records. Deactivate it instead.'),
            ]);
        }

        $year->delete();
        $this->activity->record(ActivityAction::Deleted, ActivityModule::AcademicYears, $year);
    }

    private function isUsed(AcademicYear $year): bool
    {
        return MonitoringReport::query()->where('academic_year', $year->label)->exists()
            || ChecklistResponse::query()->where('academic_year', $year->label)->exists();
    }
}
