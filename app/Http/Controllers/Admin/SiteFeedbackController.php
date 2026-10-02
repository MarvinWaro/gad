<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\FeedbackType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SiteFeedbackFilterRequest;
use App\Http\Resources\SiteFeedbackResource;
use App\Models\SiteFeedback;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\SiteFeedbackSummary;
use App\Support\CsvCell;
use App\Support\FeedbackQuestions;
use App\Support\InstitutionName;
use App\Support\PlaceFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Public site → Feedback: what visitors sent through the website feedback
 * form, as far as the staff account's office reaches.
 */
class SiteFeedbackController extends Controller
{
    public function index(SiteFeedbackFilterRequest $request, SiteFeedbackSummary $summary): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $type = FeedbackType::tryFrom((string) ($filters['type'] ?? ''));

        return Inertia::render('admin/feedback/index', [
            'feedback' => SiteFeedbackResource::collection(
                $this->filtered($user, $filters, $type)
                    ->with(['region:id,name', 'cluster:id,name', 'hei:id,name'])
                    ->latest()
                    ->orderByDesc('id')
                    ->paginate(20)
                    ->withQueryString(),
            ),
            'summary' => $summary->for($this->scope($user, $filters), $type),
            'questions' => FeedbackQuestions::forForm(),
            'types' => FeedbackType::options(),
            'filters' => $filters,
            'hasOffice' => $user->hasOffice(),
            'permissions' => [
                'export' => $user->can('feedback.export'),
                'delete' => $user->can('feedback.delete'),
            ],
            ...PlaceFilters::options($user, $filters),
        ]);
    }

    public function export(SiteFeedbackFilterRequest $request, ActivityRecorder $activity): StreamedResponse
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $query = $this->filtered($user, $filters, FeedbackType::tryFrom((string) ($filters['type'] ?? '')));
        $activity->record(
            ActivityAction::Exported,
            ActivityModule::SiteFeedback,
            properties: array_filter(Arr::except($filters, 'page')) + ['format' => 'csv'],
            label: __('website feedback'),
        );
        $columns = FeedbackQuestions::columns();

        return response()->streamDownload(function () use ($query, $columns): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                throw new \RuntimeException('Unable to open the CSV output stream.');
            }
            fputcsv($handle, [
                'Submitted', 'Feedback Type', 'Feedback', 'Suggestions for improvement',
                ...array_map(FeedbackQuestions::label(...), array_keys($columns)),
                'Email', 'Name', 'Region', 'Cluster', 'HEI',
            ]);
            $query->with(['region:id,name', 'cluster:id,name', 'hei:id,name'])
                ->latest()
                ->orderByDesc('id')
                ->each(function (SiteFeedback $feedback) use ($handle, $columns): void {
                    fputcsv($handle, [
                        $feedback->created_at?->toIso8601ZuluString(),
                        $feedback->type->label(),
                        // Typed by the public.
                        CsvCell::safe($feedback->feedback),
                        CsvCell::safe($feedback->suggestions),
                        ...array_map(
                            fn (string $column): string => FeedbackQuestions::answerLabel($column, $feedback->getAttribute($column)) ?? '',
                            array_keys($columns),
                        ),
                        CsvCell::safe($feedback->email),
                        CsvCell::safe($feedback->name),
                        $feedback->region?->name,
                        $feedback->cluster?->name,
                        $feedback->hei !== null ? InstitutionName::display($feedback->hei->name) : null,
                    ]);
                });
            fclose($handle);
        }, 'phlgadis-feedback-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function destroy(SiteFeedback $siteFeedback, ActivityRecorder $activity): RedirectResponse
    {
        $siteFeedback->delete();
        $activity->record(ActivityAction::Deleted, ActivityModule::SiteFeedback, $siteFeedback);

        Inertia::flash('toast', [
            'type' => 'deleted',
            'message' => __('Feedback deleted.'),
        ]);

        return back();
    }

    /**
     * The feedback in view before the type filter: the office's reach, the
     * place filters and the search.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<SiteFeedback>
     */
    private function scope(User $user, array $filters): Builder
    {
        $query = SiteFeedback::query()->visibleTo($user);
        PlaceFilters::apply($query, $filters);
        $search = trim((string) ($filters['search'] ?? ''));

        return $query->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query
            ->where('feedback', 'like', "%{$search}%")
            ->orWhere('suggestions', 'like', "%{$search}%")
            ->orWhere('name', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%")));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<SiteFeedback>
     */
    private function filtered(User $user, array $filters, ?FeedbackType $type): Builder
    {
        return $this->scope($user, $filters)->when($type !== null, fn (Builder $query) => $query->where('type', $type));
    }
}
