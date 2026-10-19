<?php

namespace App\Support;

use App\Enums\ChecklistType;
use App\Models\SurveyHei;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;

/**
 * The institutions that have not sent CHED what a period asks of them, for
 * the "Not yet submitted" lists: the monitoring report of a semester, or a
 * GAD survey of an academic year. Active HEIs in active regions the staff
 * account reaches (its own region, or every region for the Central Office).
 * Reports still being written, or returned for correction, count as not
 * submitted.
 */
class SubmissionGaps
{
    public const PER_PAGE = 20;

    /**
     * @param  array<string, mixed>  $filters  validated: academic_year, semester, region, hei, search
     * @return LengthAwarePaginator<int, SurveyHei>
     */
    public static function reports(User $user, array $filters, string $academicYear, int $semester): LengthAwarePaginator
    {
        return self::heis($user, $filters)
            ->leftJoin('monitoring_reports', fn (JoinClause $join) => $join
                ->on('monitoring_reports.survey_hei_id', '=', 'survey_heis.id')
                ->where('monitoring_reports.academic_year', $academicYear)
                ->where('monitoring_reports.semester', $semester))
            ->where(fn (Builder $query) => $query
                ->whereNull('monitoring_reports.id')
                ->orWhereIn('monitoring_reports.status', ['draft', 'returned']))
            ->addSelect(['monitoring_reports.id as report_id', 'monitoring_reports.status as report_status'])
            ->orderBy('survey_heis.name')
            ->orderBy('survey_heis.id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * @param  array<string, mixed>  $filters  validated: academic_year, region, hei, search
     * @return LengthAwarePaginator<int, SurveyHei>
     */
    public static function checklists(User $user, ChecklistType $type, array $filters, string $academicYear): LengthAwarePaginator
    {
        return self::heis($user, $filters)
            ->whereNotExists(fn ($query) => $query
                ->selectRaw('1')
                ->from('checklist_responses')
                ->whereColumn('checklist_responses.survey_hei_id', 'survey_heis.id')
                ->where('checklist_responses.type', $type->value)
                ->where('checklist_responses.academic_year', $academicYear))
            ->orderBy('survey_heis.name')
            ->orderBy('survey_heis.id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * The institutions in reach, with their region's name and whether they
     * have a GAD focal person who can sign in to send it.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<SurveyHei>
     */
    private static function heis(User $user, array $filters): Builder
    {
        return SurveyHei::query()
            ->select(['survey_heis.id', 'survey_heis.name', 'survey_regions.name as region_name'])
            ->join('survey_clusters', 'survey_clusters.id', '=', 'survey_heis.survey_cluster_id')
            ->join('survey_regions', 'survey_regions.id', '=', 'survey_clusters.survey_region_id')
            ->where('survey_heis.is_active', true)
            ->where('survey_regions.is_active', true)
            ->when(! $user->national_access, fn (Builder $query) => $user->survey_region_id !== null
                ? $query->where('survey_clusters.survey_region_id', $user->survey_region_id)
                : $query->whereRaw('1 = 0'))
            ->when($filters['region'] ?? null, fn (Builder $query, mixed $region) => $query->where('survey_clusters.survey_region_id', $region))
            ->when($filters['hei'] ?? null, fn (Builder $query, mixed $hei) => $query->where('survey_heis.id', $hei))
            ->when($filters['search'] ?? null, fn (Builder $query, mixed $search) => $query->where('survey_heis.name', 'like', '%'.$search.'%'))
            ->withExists(['users as has_focal' => self::focalPersons(...)]);
    }

    /**
     * An institution's accounts that can send what it owes: active, and
     * holding monitoring.submit.
     *
     * @param  Builder<User>  $query
     */
    private static function focalPersons(Builder $query): void
    {
        $query->active()->withPermission('monitoring.submit');
    }
}
