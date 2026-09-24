<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Support\CommunityFeed;
use App\Support\EventCalendar;
use App\Support\InstitutionName;
use App\Support\SurveyDefinitions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->isHeiOnly()) {
            return Inertia::render('dashboard');
        }

        $user->loadMissing('hei.cluster:id,name');

        return Inertia::render('hei/home', [
            'hei' => $user->hei ? [
                'id' => $user->hei->id,
                'name' => $user->hei->name,
                'display_name' => InstitutionName::display($user->hei->name),
                // The holding cluster is not a place; leave it out of the greeting.
                'cluster' => $user->hei->cluster?->name === SurveyCluster::UNASSIGNED
                    ? null
                    : $user->hei->cluster?->name,
            ] : null,
            'surveys' => fn (): array => $this->surveys($user->survey_hei_id),
            'calendar' => fn (): array => EventCalendar::month($request->string('month')->toString() ?: null),
            'upcoming' => fn (): array => EventCalendar::upcoming(),
            'posts' => Inertia::scroll(fn () => CommunityFeed::page($user)),
            'quickLinks' => [
                ['label' => 'Event calendar', 'href' => route('events.index')],
                ['label' => 'PHLGADIS public site', 'href' => route('home')],
                ['label' => 'Profile', 'href' => route('profile.edit')],
                ['label' => 'Password and security', 'href' => route('security.edit')],
            ],
            'comingSoon' => ['Upload Monitoring', 'Records', 'GAD Training Survey', 'GAD Compliance Survey'],
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
