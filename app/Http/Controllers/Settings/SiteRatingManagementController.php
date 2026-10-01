<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Models\SiteRating;
use App\Models\SiteSetting;
use App\Services\ActivityRecorder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Settings → Site ratings: what visitors said through the homepage's
 * "Rate PHLGADIS" button, and the switch that shows or hides that button.
 */
class SiteRatingManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $rating = $this->ratingFilter($request);
        $counts = SiteRating::query()
            ->selectRaw('rating, count(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating')
            ->map(fn (mixed $total): int => (int) $total);
        $total = $counts->sum();

        return Inertia::render('settings/ratings', [
            'summary' => [
                'total' => $total,
                'average' => $total > 0
                    ? round($counts->map(fn (int $count, int $stars): int => $count * $stars)->sum() / $total, 1)
                    : null,
                'withSuggestions' => SiteRating::query()->whereNotNull('suggestion')->count(),
                'distribution' => collect([5, 4, 3, 2, 1])
                    ->map(fn (int $stars): array => ['rating' => $stars, 'count' => $counts->get($stars, 0)])
                    ->all(),
            ],
            'ratings' => $this->query($rating)
                ->latest()
                ->paginate(20)
                ->withQueryString()
                ->through(fn (SiteRating $siteRating): array => [
                    'id' => $siteRating->id,
                    'rating' => $siteRating->rating,
                    'suggestion' => $siteRating->suggestion,
                    'submitted_at' => $siteRating->created_at?->toISOString(),
                ]),
            'filters' => ['rating' => $rating],
            'buttonEnabled' => SiteSetting::ratingButtonEnabled(),
            'permissions' => [
                'export' => $request->user()->can('site-ratings.export'),
                'delete' => $request->user()->can('site-ratings.delete'),
                'update' => $request->user()->can('site-ratings.update'),
            ],
        ]);
    }

    public function export(Request $request, ActivityRecorder $activity): StreamedResponse
    {
        $rating = $this->ratingFilter($request);
        $file = 'phlgadis-ratings-'.now()->format('Y-m-d').'.csv';
        $activity->record(
            ActivityAction::Exported,
            ActivityModule::SiteRatings,
            properties: array_filter(['stars' => $rating, 'format' => 'csv']),
            label: __('site ratings'),
        );

        return response()->streamDownload(function () use ($rating): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                throw new \RuntimeException('Unable to open the CSV output stream.');
            }
            fputcsv($handle, ['Submitted', 'Rating', 'Suggestion']);
            $this->query($rating)->latest()->each(function (SiteRating $siteRating) use ($handle): void {
                fputcsv($handle, [
                    $siteRating->created_at?->toISOString(),
                    $siteRating->rating,
                    $this->safeCell($siteRating->suggestion ?? ''),
                ]);
            });
            fclose($handle);
        }, $file, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function destroy(SiteRating $siteRating, ActivityRecorder $activity): RedirectResponse
    {
        $siteRating->delete();
        $activity->record(ActivityAction::Deleted, ActivityModule::SiteRatings, $siteRating);

        Inertia::flash('toast', [
            'type' => 'deleted',
            'message' => __('Rating deleted.'),
        ]);

        return back();
    }

    public function updateButton(Request $request, ActivityRecorder $activity): RedirectResponse
    {
        $validated = $request->validate(['enabled' => ['required', 'boolean']]);
        SiteSetting::write(SiteSetting::RATING_BUTTON, (bool) $validated['enabled']);
        $activity->record(
            $validated['enabled'] ? ActivityAction::Activated : ActivityAction::Deactivated,
            ActivityModule::SiteRatings,
            label: __('the Rate PHLGADIS button'),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $validated['enabled']
                ? __('The Rate PHLGADIS button is on the homepage.')
                : __('The Rate PHLGADIS button is hidden from the homepage.'),
        ]);

        return back();
    }

    /** The star filter from the query string, or null for all ratings. */
    private function ratingFilter(Request $request): ?int
    {
        $rating = filter_var($request->query('rating'), FILTER_VALIDATE_INT);

        return $rating !== false && $rating >= 1 && $rating <= 5 ? $rating : null;
    }

    /** @return Builder<SiteRating> */
    private function query(?int $rating): Builder
    {
        return SiteRating::query()->when($rating !== null, fn (Builder $query) => $query->where('rating', $rating));
    }

    /**
     * Suggestions are typed by the public, so a cell that a spreadsheet would
     * run as a formula (=, +, -, @) is prefixed with an apostrophe.
     */
    private function safeCell(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'".$value : $value;
    }
}
