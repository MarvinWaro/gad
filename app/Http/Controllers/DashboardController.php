<?php

namespace App\Http\Controllers;

use App\Enums\ChecklistType;
use App\Http\Requests\DashboardFilterRequest;
use App\Models\MonitoringReport;
use App\Models\Survey;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\DashboardStatistics;
use App\Support\CommunityFeed;
use App\Support\EventCalendar;
use App\Support\InstitutionName;
use App\Support\InstitutionPeople;
use App\Support\SurveyDefinitions;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(DashboardFilterRequest $request, DashboardStatistics $statistics): Response
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isHeiOnly()) {
            return Inertia::render('dashboard', $statistics->for($user, $request->validated()));
        }

        return Inertia::render('hei/home', [
            'hei' => $user->hei ? [
                'id' => $user->hei->id,
                'name' => $user->hei->name,
                'display_name' => InstitutionName::display($user->hei->name),
            ] : null,
            'surveys' => fn (): array => $this->surveys($user->survey_hei_id),
            'calendar' => fn (): array => EventCalendar::month($request->string('month')->toString() ?: null),
            'upcoming' => fn (): array => EventCalendar::upcoming(),
            // "People at your institution": colleagues, its GAD Focal Persons first.
            'people' => fn (): array => InstitutionPeople::for($user),
            // Loaded just after the page appears, which shows skeletons meanwhile.
            'posts' => Inertia::scroll(fn () => CommunityFeed::page($user))->defer(),
            // The institution's reporting, which its focal persons do. Only
            // implemented modules receive links.
            'quickLinks' => $user->can('viewRecords', MonitoringReport::class) ? [
                ['key' => 'upload-monitoring', 'label' => 'Monitoring Report', 'href' => route('monitoring.create')],
                ['key' => 'gad-training-survey', 'label' => ChecklistType::Training->label(), 'href' => route('checklists.show', ChecklistType::Training)],
                ['key' => 'gad-compliance-survey', 'label' => ChecklistType::Compliance->label(), 'href' => route('checklists.show', ChecklistType::Compliance)],
                ['key' => 'records', 'label' => 'Records', 'href' => route('monitoring.records')],
            ] : [],
        ]);
    }

    /**
     * The four law surveys, whether each is open, and how many responses
     * this HEI has contributed.
     *
     * @return array<int, array<string, mixed>>
     */
    private function surveys(?int $heiId): array
    {
        $slugs = array_keys(SurveyDefinitions::factories());

        $counts = $heiId === null ? collect() : SurveyResponse::query()
            ->join('survey_versions', 'survey_versions.id', '=', 'survey_responses.survey_version_id')
            ->where('survey_responses.survey_hei_id', $heiId)
            ->groupBy('survey_versions.survey_id')
            ->selectRaw('survey_versions.survey_id, count(*) as aggregate')
            ->pluck('aggregate', 'survey_id');

        // Open means answerable now: the same rule the public homepage uses.
        $openIds = Survey::query()
            ->where('status', 'active')
            ->whereHas('versions', fn ($query) => $query->where('status', 'published'))
            ->pluck('id');

        return Survey::query()
            ->whereIn('slug', $slugs)
            ->get()
            ->sortBy(fn (Survey $survey): int => (int) array_search($survey->slug, $slugs, true))
            ->map(fn (Survey $survey): array => [
                'id' => $survey->id,
                'code' => $survey->code,
                'law_title' => $survey->law_title,
                'url' => route('surveys.show', ['law' => $survey->slug]),
                'is_open' => $openIds->contains($survey->id),
                'responses_from_hei' => (int) ($counts[$survey->id] ?? 0),
            ])
            ->values()
            ->all();
    }
}
