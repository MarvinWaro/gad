<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SurveySummaryRequest;
use App\Models\Survey;
use App\Models\User;
use App\Services\SurveyStatistics;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A survey's Summary: every question's answers as charts, from the answer
 * tallies, for the places the account's office covers (docs/survey-analytics.md).
 */
class SurveySummaryController extends Controller
{
    public function __invoke(SurveySummaryRequest $request, Survey $survey, SurveyStatistics $statistics): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('admin/surveys/summary', $statistics->summary($user, $survey, $request->validated()));
    }
}
