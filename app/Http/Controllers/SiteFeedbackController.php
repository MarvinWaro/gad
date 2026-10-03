<?php

namespace App\Http\Controllers;

use App\Actions\Feedback\SubmitSiteFeedback;
use App\Enums\FeedbackType;
use App\Http\Requests\StoreSiteFeedbackRequest;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\FeedbackQuestions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public website feedback form (/feedback), which replaced the old
 * system's Google Form so the answers reach PHLGADIS.
 */
class SiteFeedbackController extends Controller
{
    public function create(Request $request): Response
    {
        $regions = SurveyRegion::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $prefill = $this->prefill($request->user());
        // The region picked (?region=), or else the visitor's own.
        $regionId = $regions->firstWhere('id', $request->integer('region') ?: (int) $prefill['region_id'])?->id;

        return Inertia::render('feedback', [
            'questions' => FeedbackQuestions::forForm(),
            'types' => FeedbackType::options(),
            'regions' => $regions,
            // Only that region's institutions, reloaded when it changes.
            'region' => $regionId,
            'heis' => fn (): array => $regionId === null ? [] : SurveyHei::pickerOptions($regionId),
            'prefill' => $prefill,
            'textMax' => StoreSiteFeedbackRequest::TEXT_MAX,
            'sent' => $request->session()->get('feedback_sent', false),
        ]);
    }

    public function store(StoreSiteFeedbackRequest $request, SubmitSiteFeedback $submit): RedirectResponse
    {
        if (blank($request->validated('website'))) {
            $submit->handle($request->validated());
        }

        return to_route('feedback.create')->with('feedback_sent', true);
    }

    /**
     * A signed-in visitor's place, filled in for them: their institution, or
     * their office's region. Their name and email are left for them to give.
     *
     * @return array{region_id: string, hei_id: string}
     */
    private function prefill(?User $user): array
    {
        $hei = $user?->hei()->with('cluster:id,survey_region_id')->first();
        $regionId = $hei?->cluster->survey_region_id ?? $user?->survey_region_id;

        return [
            'region_id' => $regionId !== null ? (string) $regionId : '',
            'hei_id' => $hei !== null && $hei->is_active ? (string) $hei->id : '',
        ];
    }
}
