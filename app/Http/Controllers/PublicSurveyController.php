<?php

namespace App\Http\Controllers;

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\SurveyResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PublicSurveyController extends Controller
{
    public function show(Request $request, string $law): Response
    {
        $survey = Survey::query()->where('slug', $law)->where('status', 'active')->first();
        $version = $survey?->publishedVersion();

        return Inertia::render('surveys/show', [
            'lawSlug' => $law,
            'survey' => $version ? [
                'id' => $survey->id,
                'slug' => $survey->slug,
                'code' => $survey->code,
                'title' => $survey->title,
                'law_title' => $survey->law_title,
                'image_path' => $survey->image_path,
                'version_id' => $version->id,
                'version' => $version->version,
                'introduction' => $version->introduction,
                'privacy_notice' => $version->privacy_notice,
                'consent_text' => $version->consent_text,
                'retention_days' => $version->retention_days,
                'definition' => $version->definition,
                'required' => $this->requiredFlags($version->definition),
            ] : null,
            'directories' => $version
                ? [
                    ...$this->directories($this->requiredFlags($version->definition)),
                    'respondent_groups' => $this->respondentGroupChoices(
                        $this->findQuestion($version->definition, 'id', 'respondent_group', false) ?? [],
                    ),
                ]
                : ['regions' => [], 'clusters' => [], 'heis' => [], 'respondent_groups' => []],
            'confirmation' => $request->session()->pull('survey_confirmation'),
        ]);
    }

    public function store(Request $request, Survey $survey): RedirectResponse
    {
        abort_if($survey->status !== 'active', 404);
        $version = $survey->publishedVersion();
        abort_if($version === null, 404);

        $definition = $version->definition;
        $required = $this->requiredFlags($definition);
        $locked = $this->lockedAnswers($definition);
        $matrix = $this->findQuestion($definition, 'type', 'experience_matrix', false);
        $ageQuestion = $this->findQuestion($definition, 'id', 'age');
        $answeringFor = $survey->slug === 'ra-9262' ? $this->findQuestion($definition, 'id', 'answering_for') : null;
        $forMinor = $answeringFor !== null && $request->input('answering_for') === 'minor-under-legal-care';
        $noneValue = (string) ($matrix['none_option']['value'] ?? 'none');
        $textPerpetrators = array_column(array_filter($matrix['perpetrator_options'] ?? [], fn (array $option): bool => ($option['requires_text'] ?? false) === true), 'value');
        $sexQuestion = $this->findQuestion($definition, 'id', 'sex');
        $groupQuestion = $this->findQuestion($definition, 'id', 'respondent_group');
        $groupChoices = $this->respondentGroupChoices($groupQuestion);
        $multiSelects = $this->multiSelectQuestions($definition);
        $experienceValues = [...$this->optionValues($matrix, 'options'), $noneValue];
        $perpetratorValues = $this->optionValues($matrix, 'perpetrator_options');

        // A question the editor did not mark Required may be left blank, but a
        // value that IS given still has to be real and still has to sit under
        // the region and cluster the respondent chose.
        $selectionRules = [];
        foreach ($multiSelects as $id => $question) {
            $selectionRules["selections.{$id}"] = ($required[$id] ?? 'sometimes') === 'required'
                ? ['required', 'array', 'min:1']
                : ['sometimes', 'nullable', 'array'];
            $selectionRules["selections.{$id}.*"] = ['distinct', Rule::in($this->optionValues($question, 'options'))];
        }

        $validated = $request->validate([
            ...$selectionRules,
            'version_id' => ['required', 'integer'],
            'age' => [$forMinor ? 'required' : $required['age'], 'nullable', 'integer', 'min:'.($ageQuestion['min'] ?? 1), 'max:'.($forMinor ? min(17, $ageQuestion['max'] ?? 120) : ($ageQuestion['max'] ?? 120))],
            'answering_for' => [Rule::excludeIf($answeringFor === null), $required['answering_for'], 'nullable', Rule::in($this->optionValues($answeringFor, 'options'))],
            'sex' => [
                $required['sex'], 'nullable',
                Rule::in(isset($locked['sex'])
                    ? [$locked['sex']]
                    : $this->optionValues($sexQuestion, 'options')),
            ],
            'respondent_group' => [
                $required['respondent_group'], 'nullable',
                Rule::in(isset($locked['respondent_group'])
                    ? [$locked['respondent_group']]
                    : array_column($groupChoices, 'value')),
            ],
            'respondent_group_other' => ['nullable', 'string', 'max:160', Rule::requiredIf(fn (): bool => collect($groupChoices)->contains(fn (array $option): bool => $option['value'] === $request->input('respondent_group') && ($option['requires_text'] ?? false)))],
            'region_id' => [
                $required['region'], 'nullable',
                Rule::requiredIf(fn (): bool => $request->filled('cluster_id')),
                Rule::exists('survey_regions', 'id')->where('is_active', true),
            ],
            'cluster_id' => [
                $required['cluster'], 'nullable',
                // A cluster without its region would not narrow to anything.
                Rule::requiredIf(fn (): bool => $request->filled('hei_id')),
                Rule::exists('survey_clusters', 'id')->where(fn ($query) => $query->where('is_active', true)->where('survey_region_id', $request->integer('region_id'))),
            ],
            'hei_id' => [
                $required['hei'], 'nullable',
                Rule::exists('survey_heis', 'id')->where(fn ($query) => $query->where('is_active', true)->where('survey_cluster_id', $request->integer('cluster_id'))),
            ],
            'experiences' => [Rule::excludeIf($matrix === null), $required['experiences'], 'nullable', 'array'],
            'experiences.*' => ['distinct', Rule::in($experienceValues)],
            'perpetrators' => [Rule::excludeIf($matrix === null), 'array'],
            'perpetrators.*' => ['array'],
            'perpetrators.*.*' => [Rule::in($perpetratorValues)],
            'other_relative_details' => [Rule::excludeIf($matrix === null), 'array'],
            'other_relative_details.*' => ['nullable', 'string', 'max:160'],
            'consent' => ['accepted'],
            'guardian_consent' => [
                Rule::excludeIf(fn (): bool => ! $request->filled('age') || $request->integer('age') >= 18),
                Rule::requiredIf(fn (): bool => $request->filled('age') && $request->integer('age') < 18),
                'accepted',
            ],
        ]);

        if ((int) $validated['version_id'] !== $version->id) {
            throw ValidationException::withMessages(['version_id' => 'This survey changed while you were completing it. Please review the current version.']);
        }
        $experiences = array_values(array_unique($validated['experiences'] ?? []));
        if (in_array($noneValue, $experiences, true) && count($experiences) > 1) {
            throw ValidationException::withMessages(['experiences' => 'The none option cannot be combined with another experience.']);
        }
        $perpetrators = [];
        $otherRelativeDetails = [];
        foreach (array_diff($experiences, [$noneValue]) as $experience) {
            $selected = $validated['perpetrators'][$experience] ?? [];
            if ($selected === []) {
                throw ValidationException::withMessages(["perpetrators.{$experience}" => 'Select at least one perpetrator for this experience.']);
            }
            if (array_intersect($textPerpetrators, $selected) !== [] && blank($validated['other_relative_details'][$experience] ?? null)) {
                throw ValidationException::withMessages(["other_relative_details.{$experience}" => 'Provide the requested perpetrator details.']);
            }
            $perpetrators[$experience] = array_values(array_unique($selected));
            if (array_intersect($textPerpetrators, $selected) !== [] && filled($validated['other_relative_details'][$experience] ?? null)) {
                $otherRelativeDetails[$experience] = trim((string) $validated['other_relative_details'][$experience]);
            }
        }

        do {
            $reference = Str::upper(preg_replace('/[^a-zA-Z0-9]/', '', $survey->code)).'-'.Str::upper(Str::random(10));
        } while (SurveyResponse::query()->where('public_reference', $reference)->exists());

        SurveyResponse::query()->create([
            'survey_version_id' => $version->id,
            'public_reference' => $reference,
            'age' => $validated['age'] ?? null,
            'sex' => $validated['sex'] ?? null,
            'respondent_group' => $validated['respondent_group'] ?? null,
            'respondent_group_other' => $validated['respondent_group_other'] ?? null,
            'survey_region_id' => $validated['region_id'] ?? null,
            'survey_cluster_id' => $validated['cluster_id'] ?? null,
            'survey_hei_id' => $validated['hei_id'] ?? null,
            'answers' => [
                ...($multiSelects === [] ? [] : ['selections' => $this->selections($multiSelects, $validated)]),
                'experiences' => $experiences,
                'perpetrators' => $perpetrators,
                'other_relative_details' => $otherRelativeDetails,
                ...($answeringFor !== null ? ['answering_for' => $validated['answering_for'] ?? null] : []),
            ],
            'consent_at' => now(),
            'guardian_confirmed_at' => isset($validated['age']) && (int) $validated['age'] < 18 ? now() : null,
            'expires_at' => now()->addDays($version->retention_days),
        ]);

        return to_route('surveys.show', ['law' => $survey->slug])->with('survey_confirmation', $reference);
    }

    /**
     * The respondent groups a survey offers.
     *
     * Directory-backed questions read the shared list; a questionnaire
     * published before that list existed keeps its own baked-in options, so
     * its live form is never emptied by the change.
     *
     * @param  array<string, mixed>  $question
     * @return list<array{value: string, label: string, requires_text?: bool}>
     */
    private function respondentGroupChoices(array $question): array
    {
        if (($question['type'] ?? null) !== 'directory_respondent_group') {
            return array_values(array_filter(
                $question['options'] ?? [],
                fn ($option): bool => is_array($option),
            ));
        }

        return SurveyRespondentGroup::active()
            ->map(fn (SurveyRespondentGroup $group): array => [
                'value' => $group->value,
                'label' => $group->label,
                'requires_text' => $group->requires_text,
            ])
            ->all();
    }

    /**
     * Check-all-that-apply questions, keyed by answer key.
     *
     * @param  array<string, mixed>  $definition
     * @return array<string, array<string, mixed>>
     */
    private function multiSelectQuestions(array $definition): array
    {
        $questions = [];
        foreach ($definition['sections'] ?? [] as $section) {
            foreach ((is_array($section) ? $section['questions'] ?? [] : []) as $question) {
                if (is_array($question) && ($question['type'] ?? null) === 'multi_select' && is_string($question['id'] ?? null)) {
                    $questions[$question['id']] = $question;
                }
            }
        }

        return $questions;
    }

    /**
     * The chosen values for each check-all-that-apply question, de-duplicated
     * and kept under their own key so they cannot collide with the matrix.
     *
     * @param  array<string, array<string, mixed>>  $questions
     * @param  array<string, mixed>  $validated
     * @return array<string, list<string>>
     */
    private function selections(array $questions, array $validated): array
    {
        $selections = [];
        foreach (array_keys($questions) as $id) {
            $chosen = $validated['selections'][$id] ?? [];
            $selections[$id] = array_values(array_unique(is_array($chosen) ? $chosen : []));
        }

        return $selections;
    }

    /**
     * Answers the questionnaire fixes, as question id => the only accepted
     * value. The public form shows these filled in and uneditable; pinning
     * them here is what actually enforces it.
     *
     * @param  array<string, mixed>  $definition
     * @return array<string, string>
     */
    private function lockedAnswers(array $definition): array
    {
        $locked = [];
        foreach ($definition['sections'] ?? [] as $section) {
            foreach ((is_array($section) ? $section['questions'] ?? [] : []) as $question) {
                if (! is_array($question) || ($question['locked'] ?? false) !== true) {
                    continue;
                }
                $default = $question['default'] ?? null;
                $choices = array_column(is_array($question['options'] ?? null) ? $question['options'] : [], 'value');
                if (is_string($default) && in_array($default, $choices, true)) {
                    $locked[(string) $question['id']] = $default;
                }
            }
        }

        return $locked;
    }

    /**
     * Whether each answer must be given, taken from the published definition.
     * Core respondent fields fail closed; optional question types may be absent.
     *
     * @param  array<string, mixed>  $definition
     * @return array<string, string>
     */
    private function requiredFlags(array $definition): array
    {
        $flags = [];
        foreach ($definition['sections'] ?? [] as $section) {
            foreach ((is_array($section) ? $section['questions'] ?? [] : []) as $question) {
                if (is_array($question) && is_string($question['id'] ?? null)) {
                    $flags[$question['id']] = ($question['required'] ?? true) === true;
                }
            }
        }

        $rules = [];
        $ids = [...array_keys($flags), 'age', 'sex', 'respondent_group', 'region', 'cluster', 'hei', 'experiences', 'answering_for'];
        foreach (array_unique($ids) as $id) {
            $rules[$id] = ($flags[$id] ?? ! in_array($id, ['experiences', 'answering_for'], true)) ? 'required' : 'sometimes';
        }

        return $rules;
    }

    /**
     * The choices a respondent can actually complete.
     *
     * Region, cluster, and HEI narrow each other, so a branch that ends before
     * a *required* level is a dead end: picking it would leave the respondent
     * unable to continue and unable to see why. Those branches are withheld
     * rather than offered and then rejected. A level the questionnaire marks
     * optional is free to be empty, because the respondent can move on.
     *
     * @param  array<string, string>  $required
     * @return array<string, mixed>
     */
    private function directories(array $required): array
    {
        $regions = SurveyRegion::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $clusters = SurveyCluster::query()->where('is_active', true)->orderBy('name')->get(['id', 'survey_region_id', 'name']);
        $heis = SurveyHei::query()->where('is_active', true)->orderBy('name')->get(['id', 'survey_cluster_id', 'name']);

        if ($required['hei'] === 'required') {
            $clusters = $clusters->whereIn('id', $heis->pluck('survey_cluster_id')->unique())->values();
        }
        if ($required['cluster'] === 'required' || $required['hei'] === 'required') {
            $regions = $regions->whereIn('id', $clusters->pluck('survey_region_id')->unique())->values();
        }

        $clusters = $clusters->whereIn('survey_region_id', $regions->pluck('id'))->values();
        $heis = $heis->whereIn('survey_cluster_id', $clusters->pluck('id'))->values();

        return ['regions' => $regions, 'clusters' => $clusters, 'heis' => $heis];
    }

    /** @param array<string, mixed> $definition
     * @return array<string, mixed>|null
     */
    private function findQuestion(array $definition, string $field, string $value, bool $required = true): ?array
    {
        foreach ($definition['sections'] ?? [] as $section) {
            if (! is_array($section)) {
                continue;
            }
            foreach ($section['questions'] ?? [] as $question) {
                if (is_array($question) && ($question[$field] ?? null) === $value) {
                    return $question;
                }
            }
        }

        abort_if($required, 422, 'The published survey definition is incomplete.');

        return null;
    }

    /** @param array<string, mixed> $question
     * @return array<int, string>
     */
    private function optionValues(?array $question, string $key): array
    {
        $values = [];
        foreach ($question[$key] ?? [] as $option) {
            if (is_array($option) && is_string($option['value'] ?? null)) {
                $values[] = $option['value'];
            }
        }

        return $values;
    }
}
