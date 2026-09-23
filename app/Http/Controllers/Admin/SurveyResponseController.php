<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SurveyResponseController extends Controller
{
    public function index(Request $request, Survey $survey): Response
    {
        $responses = $this->query($request, $survey)
            ->with(['version:id,version', 'region:id,name', 'cluster:id,name', 'hei:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (SurveyResponse $response): array => $this->serialize($response, false));

        return Inertia::render('admin/surveys/responses', [
            'survey' => ['id' => $survey->id, 'code' => $survey->code, 'title' => $survey->title],
            'responses' => $responses,
            'filters' => $request->only(['search', 'sex', 'respondent_group']),
            'permissions' => [
                'export' => $request->user()->can('survey-responses.export'),
                'delete' => $request->user()->can('survey-responses.delete'),
            ],
        ]);
    }

    public function show(Request $request, Survey $survey, SurveyResponse $surveyResponse): Response
    {
        abort_unless($surveyResponse->version()->where('survey_id', $survey->id)->exists(), 404);
        $surveyResponse->load(['version.survey', 'region', 'cluster', 'hei']);

        return Inertia::render('admin/surveys/response-show', [
            'survey' => ['id' => $survey->id, 'code' => $survey->code, 'title' => $survey->title],
            'response' => $this->serialize($surveyResponse, true),
            'canDelete' => $request->user()->can('survey-responses.delete'),
        ]);
    }

    public function export(Request $request, Survey $survey): StreamedResponse
    {
        $file = str($survey->slug)->append('-responses-', now()->format('Y-m-d'), '.csv')->toString();

        return response()->streamDownload(function () use ($request, $survey): void {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                throw new \RuntimeException('Unable to open the CSV output stream.');
            }
            $selectionColumns = $this->selectionColumns($survey);
            fputcsv($handle, ['Reference', 'Version', 'Submitted', 'Age', 'Sex', 'Respondent group', 'Region', 'Cluster', 'HEI', 'Experiences', 'Perpetrators', 'Expires', 'Specified perpetrator details', ...($survey->slug === 'ra-9262' ? ['Answering for'] : []), ...array_values($selectionColumns)]);
            $this->query($request, $survey)->with(['version', 'region', 'cluster', 'hei'])->latest()->each(function (SurveyResponse $response) use ($handle, $survey, $selectionColumns): void {
                fputcsv($handle, [
                    $response->public_reference,
                    $response->version->version,
                    $response->created_at?->toISOString(),
                    $response->age,
                    $response->sex,
                    $response->respondent_group_other ?: $response->respondent_group,
                    $response->region?->name,
                    $response->cluster?->name,
                    $response->hei?->name,
                    implode('; ', $response->answers['experiences'] ?? []),
                    $this->formatPerpetrators($response->answers['perpetrators'] ?? []),
                    $response->expires_at->toISOString(),
                    $this->formatDetails($response->answers['other_relative_details'] ?? []),
                    ...($survey->slug === 'ra-9262' ? [$this->answerLabels($response)['answering_for'][$response->answers['answering_for'] ?? ''] ?? 'Not provided'] : []),
                    ...array_map(
                        fn (string $id): string => implode('; ', $response->answers['selections'][$id] ?? []),
                        array_keys($selectionColumns),
                    ),
                ]);
            });
            fclose($handle);
        }, $file, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function destroy(Survey $survey, SurveyResponse $surveyResponse): RedirectResponse
    {
        abort_unless($surveyResponse->version()->where('survey_id', $survey->id)->exists(), 404);
        $surveyResponse->delete();

        return to_route('admin.surveys.responses.index', $survey);
    }

    /** @return Builder<SurveyResponse> */
    private function query(Request $request, Survey $survey): Builder
    {
        return SurveyResponse::query()
            ->whereHas('version', fn (Builder $query) => $query->where('survey_id', $survey->id))
            ->when($request->filled('search'), fn (Builder $query) => $query->where('public_reference', 'like', '%'.trim((string) $request->query('search')).'%'))
            ->when($request->filled('sex'), fn (Builder $query) => $query->where('sex', $request->query('sex')))
            ->when($request->filled('respondent_group'), fn (Builder $query) => $query->where('respondent_group', $request->query('respondent_group')));
    }

    /** @return array<string, mixed> */
    private function serialize(SurveyResponse $response, bool $details): array
    {
        $data = [
            'id' => $response->id,
            'reference' => $response->public_reference,
            'version' => $response->version->version,
            'age' => $response->age,
            'sex' => $response->sex,
            'respondent_group' => $response->respondent_group,
            'respondent_group_other' => $response->respondent_group_other,
            // These answers are optional when the questionnaire says so, so a
            // reviewer sees an explicit gap rather than a crash or a blank.
            'region' => $response->region?->name ?? 'Not provided',
            'cluster' => $response->cluster?->name ?? 'Not provided',
            'hei' => $response->hei?->name ?? 'Not provided',
            'submitted_at' => $response->created_at?->toISOString(),
            'expires_at' => $response->expires_at->toISOString(),
        ];
        if ($details) {
            $data['answers'] = $response->answers;
            $data['answer_labels'] = $this->answerLabels($response);
        }

        return $data;
    }

    /**
     * Check-all-that-apply questions on the survey's published questionnaire,
     * as answer key => column heading, so the export has stable columns.
     *
     * @return array<string, string>
     */
    private function selectionColumns(Survey $survey): array
    {
        $columns = [];
        foreach ($survey->publishedVersion()?->definition['sections'] ?? [] as $section) {
            foreach ((is_array($section) ? $section['questions'] ?? [] : []) as $question) {
                if (is_array($question) && ($question['type'] ?? null) === 'multi_select' && is_string($question['id'] ?? null)) {
                    $columns[$question['id']] = (string) ($question['label'] ?? $question['id']);
                }
            }
        }

        return $columns;
    }

    /** @return array<string, array<string, string>> */
    private function answerLabels(SurveyResponse $response): array
    {
        $labels = ['sex' => [], 'respondent_group' => [], 'experiences' => [], 'perpetrators' => [], 'answering_for' => [], 'selections' => []];

        foreach ($response->version->definition['sections'] ?? [] as $section) {
            if (! is_array($section)) {
                continue;
            }
            foreach ($section['questions'] ?? [] as $question) {
                if (! is_array($question) || ! is_string($question['id'] ?? null)) {
                    continue;
                }
                $key = $question['id'];
                if (in_array($key, ['sex', 'respondent_group', 'answering_for'], true)) {
                    $labels[$key] = $this->optionLabels($question['options'] ?? []);
                }
                if (($question['type'] ?? null) === 'multi_select') {
                    $labels['selections'][$key] = [
                        'label' => (string) ($question['label'] ?? $key),
                        'options' => $this->optionLabels($question['options'] ?? []),
                    ];
                }
                if ($key === 'experiences') {
                    $labels['experiences'] = $this->optionLabels([...($question['options'] ?? []), ...(isset($question['none_option']) ? [$question['none_option']] : [])]);
                    $labels['perpetrators'] = $this->optionLabels($question['perpetrator_options'] ?? []);
                }
            }
        }

        return $labels;
    }

    /** @return array<string, string> */
    private function optionLabels(mixed $options): array
    {
        if (! is_array($options)) {
            return [];
        }

        $labels = [];
        foreach ($options as $option) {
            if (is_array($option) && is_string($option['value'] ?? null) && is_string($option['label'] ?? null)) {
                $labels[$option['value']] = $option['label'];
            }
        }

        return $labels;
    }

    /** @param array<string, string> $details */
    private function formatDetails(array $details): string
    {
        $formatted = [];
        foreach ($details as $experience => $detail) {
            $formatted[] = $experience.': '.$detail;
        }

        return implode('; ', $formatted);
    }

    private function formatPerpetrators(mixed $answers): string
    {
        if (! is_array($answers)) {
            return '';
        }

        $formatted = [];
        foreach ($answers as $experience => $values) {
            if (is_string($experience) && is_array($values)) {
                $formatted[] = $experience.': '.implode('|', array_filter($values, 'is_string'));
            }
        }

        return implode('; ', $formatted);
    }
}
