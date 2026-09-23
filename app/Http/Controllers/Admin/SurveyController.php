<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyVersion;
use App\Support\SurveyDefinitions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SurveyController extends Controller
{
    public function index(Request $request): Response
    {
        $surveys = Survey::query()
            ->with(['versions' => fn ($query) => $query->withCount('responses')])
            ->latest()
            ->get()
            ->map(fn (Survey $survey): array => [
                'id' => $survey->id,
                'code' => $survey->code,
                'slug' => $survey->slug,
                'title' => $survey->title,
                'law_title' => $survey->law_title,
                'status' => $survey->status,
                'draft_version' => $survey->versions->where('status', 'draft')->max('version'),
                'published_version' => $survey->versions->where('status', 'published')->max('version'),
                'publication_status' => $survey->status === 'archived'
                    ? 'Archived'
                    : ($survey->versions->contains('status', 'published') ? 'Published' : 'Draft'),
                'responses_count' => $survey->versions->sum('responses_count'),
                'public_url' => $survey->versions->contains('status', 'published') && $survey->status !== 'archived'
                    ? route('surveys.show', ['law' => $survey->slug])
                    : null,
            ]);

        return Inertia::render('admin/surveys/index', [
            'surveys' => $surveys,
            'permissions' => [
                'create' => $request->user()->can('surveys.create'),
                'update' => $request->user()->can('surveys.update'),
                'publish' => $request->user()->can('surveys.publish'),
                'delete' => $request->user()->can('surveys.delete'),
                'responses' => $request->user()->can('survey-responses.view'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:40', 'unique:surveys,code'],
            'title' => ['required', 'string', 'max:160'],
            'law_title' => ['required', 'string', 'max:200'],
            'slug' => ['required', 'alpha_dash', 'max:100', 'unique:surveys,slug'],
        ]);

        $survey = DB::transaction(function () use ($validated, $request): Survey {
            $survey = Survey::query()->create([...$validated, 'status' => 'active', 'created_by' => $request->user()->id]);
            $survey->versions()->create([
                'version' => 1,
                'status' => 'draft',
                'introduction' => 'Describe the purpose of this survey.',
                'privacy_notice' => 'Add the approved privacy notice before publication.',
                'consent_text' => 'I consent to the processing of my responses for the stated purpose.',
                'definition' => ['sections' => []],
            ]);

            return $survey;
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Draft v1 created. Build the questionnaire, then publish it.'),
        ]);

        return to_route('admin.surveys.edit', $survey);
    }

    public function edit(Request $request, Survey $survey): Response
    {
        $draft = $survey->draftVersion();
        abort_if($draft === null, 409, 'This survey has no editable draft.');
        $live = $survey->publishedVersion();

        return Inertia::render('admin/surveys/edit', [
            'survey' => [
                'id' => $survey->id,
                'code' => $survey->code,
                'slug' => $survey->slug,
                'title' => $survey->title,
                'law_title' => $survey->law_title,
                'image_path' => $survey->image_path,
                'status' => $survey->status,
                'published_version' => $live?->version,
                'published_at' => $live?->published_at?->toIso8601String(),
                'public_url' => $live !== null && $survey->status !== 'archived'
                    ? route('surveys.show', ['law' => $survey->slug])
                    : null,
            ],
            'draft' => [
                'id' => $draft->id,
                'version' => $draft->version,
                'introduction' => $draft->introduction,
                'privacy_notice' => $draft->privacy_notice,
                'consent_text' => $draft->consent_text,
                'retention_days' => $draft->retention_days,
                'definition' => $draft->definition,
                'updated_at' => $draft->updated_at?->toIso8601String(),
            ],
            'directoryStatus' => [
                'regions' => SurveyRegion::query()->where('is_active', true)->count(),
                'clusters' => SurveyCluster::query()->where('is_active', true)->count(),
                'heis' => SurveyHei::query()->where('is_active', true)->count(),
            ],
            'readiness' => $this->publishChecks($request, $survey, $draft),
            'permissions' => [
                'update' => $request->user()->can('surveys.update'),
                'publish' => $request->user()->can('surveys.publish'),
            ],
        ]);
    }

    public function update(Request $request, Survey $survey): RedirectResponse
    {
        $draft = $survey->draftVersion();
        abort_if($draft === null, 409);
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'law_title' => ['required', 'string', 'max:200'],
            'introduction' => ['required', 'string', 'max:3000'],
            'privacy_notice' => ['required', 'string', 'max:6000'],
            'consent_text' => ['required', 'string', 'max:3000'],
            'retention_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'definition' => ['required', 'array'],
            'definition.sections' => ['required', 'array', 'min:1'],
            'definition.sections.*.id' => ['required', 'alpha_dash', 'distinct'],
            'definition.sections.*.title' => ['required', 'string', 'max:160'],
            'definition.sections.*.questions' => ['required', 'array', 'min:1'],
            'definition.sections.*.questions.*.id' => ['required', 'alpha_dash'],
            'definition.sections.*.questions.*.type' => ['required', Rule::in(['integer', 'single_select', 'multi_select', 'directory_region', 'directory_cluster', 'directory_hei', 'directory_respondent_group', 'experience_matrix'])],
            'definition.sections.*.questions.*.label' => ['required', 'string', 'max:240'],
            'definition.sections.*.questions.*.required' => ['required', 'boolean'],
            'definition.sections.*.questions.*.min' => ['sometimes', 'integer', 'min:1', 'max:120'],
            'definition.sections.*.questions.*.max' => ['sometimes', 'integer', 'min:1', 'max:120'],
            'definition.sections.*.questions.*.options.*.requires_text' => ['sometimes', 'boolean'],
            'definition.sections.*.questions.*.perpetrator_options.*.requires_text' => ['sometimes', 'boolean'],
            'definition.sections.*.questions.*.default' => ['sometimes', 'nullable', 'alpha_dash'],
            'definition.sections.*.questions.*.locked' => ['sometimes', 'boolean'],
            'definition.sections.*.questions.*.options' => ['sometimes', 'array'],
            'definition.sections.*.questions.*.options.*.value' => ['required', 'alpha_dash'],
            'definition.sections.*.questions.*.options.*.label' => ['required', 'string', 'max:240'],
            'definition.sections.*.questions.*.none_option' => ['sometimes', 'array'],
            'definition.sections.*.questions.*.none_option.value' => ['required_with:definition.sections.*.questions.*.none_option', 'alpha_dash'],
            'definition.sections.*.questions.*.none_option.label' => ['required_with:definition.sections.*.questions.*.none_option', 'string', 'max:240'],
            'definition.sections.*.questions.*.perpetrator_options' => ['sometimes', 'array'],
            'definition.sections.*.questions.*.perpetrator_options.*.value' => ['required', 'alpha_dash'],
            'definition.sections.*.questions.*.perpetrator_options.*.label' => ['required', 'string', 'max:240'],
        ]);

        $definition = $request->input('definition');
        abort_unless(is_array($definition), 422);

        $survey->update([
            'title' => $request->string('title')->toString(),
            'law_title' => $request->string('law_title')->toString(),
        ]);
        $draft->update([
            'introduction' => $request->string('introduction')->toString(),
            'privacy_notice' => $request->string('privacy_notice')->toString(),
            'consent_text' => $request->string('consent_text')->toString(),
            'retention_days' => $request->filled('retention_days') ? $request->integer('retention_days') : null,
            'definition' => $definition,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Draft v:version saved. It stays private until you publish it.', ['version' => $draft->version]),
        ]);

        return back();
    }

    public function publish(Request $request, Survey $survey): RedirectResponse
    {
        $draft = $survey->draftVersion();
        abort_if($draft === null, 409);

        $errors = [];
        foreach ($this->publishChecks($request, $survey, $draft) as $check) {
            if ($check['passed'] === false) {
                $errors[$check['error_key']] = $check['detail'];
            }
        }
        if ($errors !== []) {
            return back()->withErrors($errors);
        }

        $publishedVersion = $draft->version;

        DB::transaction(function () use ($survey, $draft, $request): void {
            $survey->versions()->where('status', 'published')->update(['status' => 'superseded']);
            $draft->update(['status' => 'published', 'published_at' => now(), 'published_by' => $request->user()->id]);
            $survey->versions()->create([
                'version' => $draft->version + 1,
                'status' => 'draft',
                'introduction' => $draft->introduction,
                'privacy_notice' => $draft->privacy_notice,
                'consent_text' => $draft->consent_text,
                'retention_days' => $draft->retention_days,
                'definition' => $draft->definition,
            ]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Version :version is live. Draft v:next is open for your next edits.', [
                'version' => $publishedVersion,
                'next' => $publishedVersion + 1,
            ]),
        ]);

        return back();
    }

    public function archive(Survey $survey): RedirectResponse
    {
        $archiving = $survey->status !== 'archived';
        $survey->update(['status' => $archiving ? 'archived' : 'active']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $archiving
                ? __(':code is archived and closed to the public.', ['code' => $survey->code])
                : __(':code is active again.', ['code' => $survey->code]),
        ]);

        return back();
    }

    public function destroy(Survey $survey): RedirectResponse
    {
        if ($survey->versions()->whereIn('status', ['published', 'superseded'])->exists() || $survey->versions()->whereHas('responses')->exists()) {
            return back()->withErrors(['survey' => 'Published surveys must be archived and cannot be deleted.']);
        }
        $code = $survey->code;
        $survey->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':code was deleted.', ['code' => $code]),
        ]);

        return to_route('admin.surveys.index');
    }

    /**
     * Every condition a draft must meet before it can go live, in the order an
     * editor works through them. publish() turns the failures into validation
     * errors; edit() renders the same list so none of them is a surprise.
     *
     * @return list<array{key: string, error_key: string, label: string, passed: bool, detail: string, href: string|null}>
     */
    private function publishChecks(Request $request, Survey $survey, SurveyVersion $draft): array
    {
        $hasDirectoryChain = SurveyHei::query()
            ->where('is_active', true)
            ->whereHas('cluster', fn ($query) => $query->where('is_active', true)
                ->whereHas('region', fn ($query) => $query->where('is_active', true)))
            ->exists();
        $definitionError = $this->definitionError($draft->definition, $survey->slug);

        return [
            [
                'key' => 'notices',
                'error_key' => 'privacy_notice',
                'label' => 'Introduction, privacy notice, and consent text',
                'passed' => filled($draft->introduction) && filled($draft->privacy_notice) && filled($draft->consent_text),
                'detail' => 'Respondents read all three before answering. Fill in each one under Survey details.',
                'href' => null,
            ],
            [
                'key' => 'retention',
                'error_key' => 'retention_days',
                'label' => 'Response retention period',
                'passed' => $draft->retention_days !== null,
                'detail' => 'Set how many days a response is kept before it is deleted automatically.',
                'href' => null,
            ],
            [
                'key' => 'directories',
                'error_key' => 'directories',
                'label' => 'Region, cluster, and HEI directory',
                'passed' => $hasDirectoryChain,
                'detail' => 'Respondents choose their institution from this list. Add at least one active Region, Cluster, and HEI.',
                'href' => $request->user()?->can('survey-directories.view')
                    ? route('settings.regions.index')
                    : null,
            ],
            [
                'key' => 'definition',
                'error_key' => 'definition',
                'label' => 'Question structure',
                'passed' => $definitionError === null,
                'detail' => $definitionError ?? 'Every section has at least one question and every answer key is unique.',
                'href' => null,
            ],
        ];
    }

    /** @param array<string, mixed> $definition */
    private function definitionError(array $definition, string $surveySlug): ?string
    {
        $sections = $definition['sections'] ?? null;
        if (! is_array($sections) || $sections === []) {
            return 'Add at least one survey section.';
        }

        $supported = SurveyDefinitions::contract('ra-7877') + SurveyDefinitions::contract($surveySlug);
        $questionIds = [];
        $questionTypes = [];
        foreach ($sections as $section) {
            if (! is_array($section) || ! is_array($section['questions'] ?? null) || $section['questions'] === []) {
                return 'Every section must contain at least one question.';
            }
            foreach ($section['questions'] as $question) {
                if (! is_array($question) || ! is_string($question['id'] ?? null) || ! is_string($question['type'] ?? null)) {
                    return 'Every question needs a stable key and supported type.';
                }
                if (in_array($question['id'], $questionIds, true)) {
                    return "Question keys must be unique; '{$question['id']}' is duplicated.";
                }
                if (($supported[$question['id']] ?? null) !== $question['type']) {
                    return "The question '{$question['id']}' is not supported by the public form.";
                }
                if ($question['id'] === 'answering_for' && (count($question['options'] ?? []) !== 2 || array_diff(['self', 'minor-under-legal-care'], array_column($question['options'] ?? [], 'value')) !== [])) {
                    return 'Answering for must retain the self and minor-under-legal-care answer keys.';
                }
                if ($question['id'] === 'age') {
                    $min = $question['min'] ?? 1;
                    $max = $question['max'] ?? 120;
                    if (! is_int($min) || ! is_int($max) || $min < 1 || $max > 120 || $min > $max || ($surveySlug === 'ra-9262' && $min >= 18)) {
                        return 'Age needs valid limits between 1 and 120 and must allow minors for RA 9262.';
                    }
                }
                if ($question['type'] === 'experience_matrix') {
                    $textChoices = array_filter($question['perpetrator_options'] ?? [], fn (array $option): bool => ($option['requires_text'] ?? false) === true);
                    if (count($textChoices) > 1) {
                        return 'Only one perpetrator choice may require text per experience.';
                    }
                    $none = $question['none_option'] ?? [];
                    if (blank($none['value'] ?? null) || blank($none['label'] ?? null) || in_array($none['value'], array_column($question['options'] ?? [], 'value'), true)) {
                        return 'The none choice needs a unique answer key and a label.';
                    }
                }
                $questionIds[] = $question['id'];
                $questionTypes[$question['id']] = $question['type'];

                if (in_array($question['type'], ['single_select', 'multi_select'], true) && ! $this->hasUniqueOptions($question['options'] ?? null)) {
                    return "The '{$question['id']}' question needs unique choices.";
                }
                // Locking fixes the answer to the default, so without one there
                // is nothing to fix it to and the control would ship empty.
                if (($question['locked'] ?? false) === true && blank($question['default'] ?? null)) {
                    return "The '{$question['id']}' question is locked but has no default answer to lock to.";
                }
                // A default left pointing at a renamed or deleted choice would
                // pre-select a value the public form then fails to submit.
                if (filled($question['default'] ?? null)) {
                    $choices = array_column(is_array($question['options'] ?? null) ? $question['options'] : [], 'value');
                    if (! in_array($question['default'], $choices, true)) {
                        return "The default answer for '{$question['id']}' is not one of its choices.";
                    }
                }
                if ($question['type'] === 'experience_matrix' &&
                    (! $this->hasUniqueOptions($question['options'] ?? null) ||
                     ! $this->hasUniqueOptions($question['perpetrator_options'] ?? null) ||
                     ! is_array($question['none_option'] ?? null))) {
                    return 'The experience matrix needs experiences, a none choice, and perpetrator choices.';
                }
            }
        }

        foreach (SurveyDefinitions::contract($surveySlug) as $id => $type) {
            if (($questionTypes[$id] ?? null) !== $type) {
                return strtoupper(str_replace('-', ' ', $surveySlug))." needs a '{$type}' question whose answer key is '{$id}'.";
            }
        }

        return null;
    }

    private function hasUniqueOptions(mixed $options): bool
    {
        if (! is_array($options) || $options === []) {
            return false;
        }
        $values = [];
        foreach ($options as $option) {
            if (! is_array($option) || blank($option['value'] ?? null) || blank($option['label'] ?? null)) {
                return false;
            }
            $values[] = (string) $option['value'];
        }

        return count($values) === count(array_unique($values));
    }
}
