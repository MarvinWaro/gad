<?php

namespace App\Services;

use App\Models\Survey;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\User;
use App\Support\AcademicPeriod;
use App\Support\DashboardScope;
use App\Support\PlaceFilters;
use App\Support\ReportingPeriod;
use App\Support\RespondentDetails;
use App\Support\SurveyDefinitions;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use stdClass;

/**
 * The law surveys' figures, counted in SQL from the tallies, which outlive
 * the responses: totals from survey_response_tallies, answers from
 * survey_answer_tallies. The dashboard's survey figures, the Surveys page's
 * insights and each survey's Summary all come from here
 * (docs/survey-analytics.md).
 *
 * Places follow DashboardScope: a regional office sees its own region, the
 * Central Office every region. Answers are only shown with at least
 * MIN_RESPONSES responses in view, so no one can be picked out of a small
 * group.
 *
 * @phpstan-type Breakdown list<array{value: string, label: string, responses: int}>
 * @phpstan-type AnswerOption array{value: string, label: string, count: int, female: int|null, male: int|null, details: list<array{value: string, label: string, count: int}>}
 * @phpstan-type Question array{key: string, label: string, group: 'answers'|'respondents', kind: 'matrix'|'choices', options: list<AnswerOption>}
 */
class SurveyStatistics
{
    /** How long figures are reused before they are counted again. */
    public const CACHE_SECONDS = 60;

    /** Fewest responses in view before any answer is shown. */
    public const MIN_RESPONSES = 5;

    /** HEIs listed under "Where responses come from" within a region. */
    public const TOP_HEIS = 10;

    /** The sexes the forms offer, in their order. */
    private const SEXES = ['female', 'male', 'intersex', 'prefer-not-to-say'];

    /**
     * The Surveys page's insights: totals, the trend, each law, who answered
     * and where from, for the places the account's office covers.
     *
     * @param  array<string, mixed>  $filters  validated by DashboardFilterRequest::staffRules()
     * @return array<string, mixed>
     */
    public function overview(User $user, array $filters): array
    {
        $period = ReportingPeriod::fromFilters($filters);
        $scope = DashboardScope::for($user, $filters);
        $key = 'survey-insights:'.sha1((string) json_encode([$scope->cacheKey(), $period->toArray()]));

        return Cache::remember($key, self::CACHE_SECONDS, function () use ($scope, $period): array {
            $days = $this->responsesPerDay($scope, $period);

            return [
                'period' => $period->toArray(),
                'scope' => ['label' => $scope->label(), 'national' => $scope->isNational()],
                'kpis' => [
                    'responses' => $this->responses($scope, $period),
                    'participation' => $this->participation($scope, $period),
                    'live' => $this->liveSurveys(),
                ],
                'trend' => array_map(fn (array $bucket): array => [
                    'label' => $bucket['label'],
                    'title' => $bucket['title'],
                    'responses' => $this->responsesBetween($days, $bucket['starts_on'], $bucket['ends_on']),
                ], $period->buckets()),
                'laws' => $this->laws($scope, $period),
                'respondents' => $this->respondents($scope, $period),
                'places' => $this->places($scope, $period),
            ];
        });
    }

    /**
     * The insights' filters and their choices, sent with the page so they
     * stay in place while the figures load.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function overviewFilters(User $user, array $filters): array
    {
        return [
            ...$this->filterState($user, DashboardScope::for($user, $filters), ReportingPeriod::fromFilters($filters), $filters),
            'hasOffice' => $user->hasOffice(),
        ];
    }

    /**
     * One survey's Summary: how many answered, and every question's answers,
     * split by sex. Sex and respondent group narrow it further. Below
     * MIN_RESPONSES responses only the totals are given.
     *
     * @param  array<string, mixed>  $filters  validated by SurveySummaryRequest
     * @return array<string, mixed>
     */
    public function summary(User $user, Survey $survey, array $filters): array
    {
        $period = ReportingPeriod::fromFilters($filters);
        $scope = DashboardScope::for($user, [...$filters, 'survey' => $survey->id, 'ownership' => null]);
        $sex = is_string($filters['sex'] ?? null) ? $filters['sex'] : null;
        $group = is_string($filters['respondent_group'] ?? null) ? $filters['respondent_group'] : null;
        $narrow = fn (QueryBuilder $query, string $alias): QueryBuilder => $query
            ->when($sex, fn (QueryBuilder $query) => $query->where("{$alias}.sex", $sex))
            ->when($group, fn (QueryBuilder $query) => $query->where("{$alias}.respondent_group", $group));
        $definition = $this->definitionOf($survey);
        $key = 'survey-summary:'.sha1((string) json_encode([$scope->cacheKey(), $period->toArray(), $sex, $group]));

        $figures = Cache::remember($key, self::CACHE_SECONDS, function () use ($scope, $period, $narrow, $definition): array {
            $responses = (int) $narrow($scope->tallies($period), 't')->sum('t.responses');
            $suppressed = $responses < self::MIN_RESPONSES;
            $bySex = $narrow($scope->tallies($period), 't')
                ->groupBy('t.sex')
                ->selectRaw('t.sex as sex, sum(t.responses) as responses')
                ->pluck('responses', 'sex');

            return [
                'period' => $period->toArray(),
                'scope' => ['label' => $scope->label(), 'national' => $scope->isNational()],
                'totals' => [
                    'responses' => $responses,
                    'heis' => $narrow($scope->tallies($period), 't')->where('t.responses', '>', 0)->whereNotNull('t.survey_hei_id')->distinct()->count('t.survey_hei_id'),
                    'female' => (int) ($bySex['female'] ?? 0),
                    'male' => (int) ($bySex['male'] ?? 0),
                ],
                'suppressed' => $suppressed,
                'questions' => $suppressed ? [] : $this->questions(
                    $definition,
                    $narrow($scope->answerTallies($period), 'a'),
                    $narrow($scope->tallies($period), 't'),
                ),
            ];
        });

        $state = $this->filterState($user, $scope, $period, $filters);

        return [
            'survey' => ['id' => $survey->id, 'code' => $survey->code, 'title' => $survey->title, 'law_title' => $survey->law_title],
            ...$figures,
            'filters' => [...Arr::except($state['filters'], ['ownership', 'survey']), 'sex' => $sex ?? '', 'respondent_group' => $group ?? ''],
            'options' => [
                ...$state['options'],
                'sexes' => $this->sexOptions($definition),
                'groups' => SurveyRespondentGroup::active()->map(fn (SurveyRespondentGroup $group): array => ['value' => $group->value, 'label' => $group->label])->values()->all(),
            ],
            'minResponses' => self::MIN_RESPONSES,
            'hasOffice' => $user->hasOffice(),
        ];
    }

    /**
     * The filters as the page shows them, and what each offers: the period,
     * the places the account may pick, ownership and law.
     *
     * @param  array<string, mixed>  $filters
     * @return array{filters: array<string, string>, options: array<string, mixed>}
     */
    public function filterState(User $user, DashboardScope $scope, ReportingPeriod $period, array $filters): array
    {
        return [
            'filters' => [
                'academic_year' => $period->academicYear,
                'view' => $period->view,
                'semester' => $period->semester === null ? '' : (string) $period->semester,
                'month' => $period->month === null ? '' : (string) $period->month,
                'region' => $user->national_access && $scope->regionId !== null ? (string) $scope->regionId : '',
                'hei' => $scope->heiId === null ? '' : (string) $scope->heiId,
                'ownership' => $scope->ownership ?? '',
                'survey' => $scope->surveyId === null ? '' : (string) $scope->surveyId,
            ],
            'options' => [
                'academicYears' => collect(AcademicPeriod::recordOptions())->push($period->academicYear)->unique()->sortDesc()->values()->all(),
                'surveys' => $this->lawSurveys()->map(fn (Survey $survey): array => ['id' => $survey->id, 'code' => $survey->code])->values()->all(),
                'ownerships' => SurveyHei::OWNERSHIPS,
                ...PlaceFilters::options($user, $filters),
            ],
        ];
    }

    /** @return array{value: int, previous: int} */
    public function responses(DashboardScope $scope, ReportingPeriod $period): array
    {
        return [
            'value' => (int) $scope->tallies($period)->sum('t.responses'),
            'previous' => (int) $scope->tallies($period->previous())->sum('t.responses'),
        ];
    }

    /** @return array{participating: int, total: int} */
    public function participation(DashboardScope $scope, ReportingPeriod $period): array
    {
        return [
            'participating' => $this->contributing($scope, $period)->count(),
            'total' => $scope->heis()->count(),
        ];
    }

    /**
     * Responses per Philippine day in the period.
     *
     * @return Collection<string, int>
     */
    public function responsesPerDay(DashboardScope $scope, ReportingPeriod $period): Collection
    {
        return $scope->tallies($period)
            ->groupBy('t.date')
            ->selectRaw('t.date as day, sum(t.responses) as responses')
            ->pluck('responses', 'day')
            ->mapWithKeys(fn (mixed $count, mixed $day): array => [substr((string) $day, 0, 10) => (int) $count]);
    }

    /** @param  Collection<string, int>  $days */
    public function responsesBetween(Collection $days, string $startsOn, string $endsOn): int
    {
        return (int) $days->filter(fn (int $count, string $day): bool => $day >= $startsOn && $day <= $endsOn)->sum();
    }

    /**
     * Active HEIs with at least one survey response in the period.
     *
     * @return Collection<int, int>
     */
    public function contributing(DashboardScope $scope, ReportingPeriod $period): Collection
    {
        return $scope->tallies($period)
            ->join('survey_heis as ph', 'ph.id', '=', 't.survey_hei_id')
            ->where('ph.is_active', true)
            ->where('t.responses', '>', 0)
            ->distinct()
            ->pluck('t.survey_hei_id')
            ->map(fn (mixed $id): int => (int) $id);
    }

    /**
     * Participation by region when several are in view; otherwise the HEIs
     * yet to contribute, for the office to follow up.
     *
     * @return array{regions: list<array{id: int, name: string, participating: int, total: int}>, waiting: array{count: int, heis: list<array{id: int, name: string}>}}
     */
    public function reach(DashboardScope $scope, ReportingPeriod $period, int $waitingNames): array
    {
        if ($scope->isNational() && ! $scope->heisOnly()) {
            $totals = $scope->heis()->toBase()
                ->join('survey_clusters as rc', 'rc.id', '=', 'survey_heis.survey_cluster_id')
                ->groupBy('rc.survey_region_id')
                ->selectRaw('rc.survey_region_id as region, count(*) as total')
                ->pluck('total', 'region');
            $participating = $scope->tallies($period)
                ->join('survey_heis as ph', 'ph.id', '=', 't.survey_hei_id')
                ->join('survey_clusters as pc', 'pc.id', '=', 'ph.survey_cluster_id')
                ->where('ph.is_active', true)
                ->where('t.responses', '>', 0)
                ->groupBy('pc.survey_region_id')
                ->selectRaw('pc.survey_region_id as region, count(distinct t.survey_hei_id) as participating')
                ->pluck('participating', 'region');

            return [
                // Leaders first: the highest share, then the most HEIs
                // contributing, then the office order. The card shows the
                // first few and the rest open in a table.
                'regions' => array_values(SurveyRegion::query()->whereIn('id', $totals->keys())->orderBy('id')->get(['id', 'name'])
                    ->map(fn (SurveyRegion $region): array => [
                        'id' => $region->id,
                        'name' => $region->name,
                        'participating' => (int) ($participating[$region->id] ?? 0),
                        'total' => (int) $totals[$region->id],
                    ])
                    ->sort(fn (array $a, array $b): int => [$b['participating'] * $a['total'], $b['participating'], $a['id']]
                        <=> [$a['participating'] * $b['total'], $a['participating'], $b['id']])
                    ->all()),
                'waiting' => ['count' => 0, 'heis' => []],
            ];
        }

        $waiting = $scope->heis()->whereNotIn('survey_heis.id', $this->contributing($scope, $period));

        return [
            'regions' => [],
            'waiting' => [
                'count' => (clone $waiting)->count(),
                'heis' => array_values($waiting->orderBy('name')->limit($waitingNames)->get(['survey_heis.id', 'survey_heis.name'])
                    ->map(fn (SurveyHei $hei): array => ['id' => $hei->id, 'name' => $hei->name])->all()),
            ],
        ];
    }

    /** @return list<array{id: int, code: string, title: string, responses: int}> */
    public function laws(DashboardScope $scope, ReportingPeriod $period): array
    {
        $counts = $scope->tallies($period)
            ->groupBy('t.survey_id')
            ->selectRaw('t.survey_id as survey, sum(t.responses) as responses')
            ->pluck('responses', 'survey');

        return array_values($this->lawSurveys()
            ->when($scope->surveyId, fn ($surveys) => $surveys->where('id', $scope->surveyId))
            ->map(fn (Survey $survey): array => [
                'id' => $survey->id,
                'code' => $survey->code,
                'title' => $survey->law_title,
                'responses' => (int) ($counts[$survey->id] ?? 0),
            ])->all());
    }

    /**
     * Responses by respondent group and by sex. "Not given" counts answers
     * a questionnaire left optional.
     *
     * @return array{groups: Breakdown, sexes: Breakdown}
     */
    public function respondents(DashboardScope $scope, ReportingPeriod $period): array
    {
        return [
            'groups' => $this->breakdown($scope->tallies($period), 'respondent_group', ...$this->groupOrder()),
            'sexes' => $this->breakdown($scope->tallies($period), 'sex', self::SEXES, fn (string $value): string => Str::ucfirst(str_replace('-', ' ', $value))),
        ];
    }

    /**
     * Where responses came from: regions when every region is in view,
     * otherwise the HEIs with the most.
     *
     * @return array{level: 'region'|'hei', rows: list<array{id: int|null, name: string, responses: int}>, total: int}
     */
    public function places(DashboardScope $scope, ReportingPeriod $period): array
    {
        if ($scope->isNational() && ! $scope->heisOnly()) {
            $counts = $scope->tallies($period)
                ->groupBy('t.survey_region_id')
                ->selectRaw('t.survey_region_id as region, sum(t.responses) as responses')
                ->havingRaw('sum(t.responses) > 0')
                ->pluck('responses', 'region');
            $names = SurveyRegion::query()->whereIn('id', $counts->keys()->filter())->pluck('name', 'id');
            $rows = $counts
                ->map(fn (mixed $responses, mixed $region): array => [
                    'id' => $region === '' ? null : (int) $region,
                    'name' => $names[$region] ?? 'Not given',
                    'responses' => (int) $responses,
                ])
                ->sortByDesc('responses')
                ->values();

            return ['level' => 'region', 'rows' => array_values($rows->all()), 'total' => $rows->count()];
        }

        $counts = $scope->tallies($period)
            ->join('survey_heis as ph', 'ph.id', '=', 't.survey_hei_id')
            ->groupBy('t.survey_hei_id', 'ph.name')
            ->selectRaw('t.survey_hei_id as hei, ph.name as name, sum(t.responses) as responses')
            ->havingRaw('sum(t.responses) > 0')
            ->orderByDesc('responses')
            ->orderBy('ph.name')
            ->get();

        return [
            'level' => 'hei',
            'rows' => array_values($counts->take(self::TOP_HEIS)->map(fn (stdClass $row): array => [
                'id' => (int) $row->hei,
                'name' => (string) $row->name,
                'responses' => (int) $row->responses,
            ])->all()),
            'total' => $counts->count(),
        ];
    }

    /**
     * The law surveys PHLGADIS runs, in the laws' order.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Survey>
     */
    public function lawSurveys(): \Illuminate\Database\Eloquent\Collection
    {
        $slugs = array_keys(SurveyDefinitions::factories());

        return Survey::query()->whereIn('slug', $slugs)->get(['id', 'slug', 'code', 'law_title'])
            ->sortBy(fn (Survey $survey): int => (int) array_search($survey->slug, $slugs, true))
            ->values();
    }

    /** Surveys the public can answer now: active, with a published version. */
    private function liveSurveys(): int
    {
        return Survey::query()
            ->where('status', 'active')
            ->whereHas('versions', fn ($query) => $query->where('status', 'published'))
            ->count();
    }

    /**
     * The survey's questions with their answers, then the respondents'
     * profile. Answers are grouped in SQL; this only arranges them.
     *
     * @param  array<string, mixed>  $definition
     * @return list<Question>
     */
    private function questions(array $definition, QueryBuilder $answers, QueryBuilder $responses): array
    {
        $rows = $answers
            ->groupBy('a.question', 'a.answer', 'a.detail', 'a.sex')
            ->selectRaw('a.question as question, a.answer as answer, a.detail as detail, a.sex as sex, sum(a.responses) as responses')
            ->having('responses', '>', 0)
            ->get()
            ->groupBy('question');
        $questions = [];

        foreach ($definition['sections'] ?? [] as $section) {
            foreach (is_array($section) ? $section['questions'] ?? [] : [] as $question) {
                if (! is_array($question)) {
                    continue;
                }

                $type = $question['type'] ?? null;
                $label = (string) ($question['label'] ?? '');
                $options = $this->labels($question['options'] ?? []);

                if ($type === 'experience_matrix') {
                    $none = $question['none_option'] ?? null;
                    if (is_array($none) && is_string($none['value'] ?? null)) {
                        $options[$none['value']] = (string) ($none['label'] ?? $none['value']);
                    }
                    $questions[] = $this->question('experiences', $label, 'answers', 'matrix', $options, $rows->get('experiences'), $rows->get('perpetrators'), $this->labels($question['perpetrator_options'] ?? []));
                } elseif ($type === 'multi_select' && is_string($question['id'] ?? null)) {
                    $key = 'selections.'.$question['id'];
                    $questions[] = $this->question($key, $label, 'answers', 'choices', $options, $rows->get($key));
                } elseif ($type === 'single_select' && ($question['id'] ?? null) === 'answering_for') {
                    $questions[] = $this->question('answering_for', $label, 'answers', 'choices', $options, $rows->get('answering_for'));
                }
            }
        }

        // Who answered, from the response tallies and the answer tallies.
        $bySex = $this->breakdown(clone $responses, 'sex', self::SEXES, fn (string $value): string => $this->sexOptions($definition)[$value] ?? Str::ucfirst(str_replace('-', ' ', $value)));
        $questions[] = [
            'key' => 'sex',
            'label' => 'Sex',
            'group' => 'respondents',
            'kind' => 'choices',
            'options' => array_values(array_map(fn (array $row): array => [
                'value' => $row['value'], 'label' => $row['label'], 'count' => $row['responses'], 'female' => null, 'male' => null, 'details' => [],
            ], array_filter($bySex, fn (array $row): bool => $row['responses'] > 0))),
        ];
        $groups = $this->groupedBySex(clone $responses, 'respondent_group');
        [$groupOrder, $groupLabel] = $this->groupOrder();
        $questions[] = $this->fromCounts('respondent_group', 'Respondent group', array_combine($groupOrder, array_map($groupLabel, $groupOrder)) ?: [], $groups, $groupLabel);
        $questions[] = $this->question('age_band', 'Age', 'respondents', 'choices', [
            'under-18' => 'Under 18', '18-24' => '18–24', '25-34' => '25–34', '35-44' => '35–44', '45-59' => '45–59', '60-plus' => '60 and over', 'not-given' => 'Not given',
        ], $rows->get('age_band'));
        $questions[] = $this->question('gender_identity', 'Gender identity', 'respondents', 'choices', $this->genderIdentityLabels(), $rows->get('gender_identity'));

        return array_values(array_filter($questions, fn (array $question): bool => $question['options'] !== []));
    }

    /**
     * One question: each known option in order, even at zero, then any
     * answer the definition no longer offers. Each is split by sex.
     *
     * @param  array<string, string>  $options
     * @param  Collection<int, stdClass>|null  $rows
     * @param  Collection<int, stdClass>|null  $detailRows
     * @param  array<string, string>  $detailLabels
     * @return Question
     */
    private function question(string $key, string $label, string $group, string $kind, array $options, ?Collection $rows, ?Collection $detailRows = null, array $detailLabels = []): array
    {
        $counts = [];
        foreach ($rows ?? [] as $row) {
            $counts[(string) $row->answer][(string) ($row->sex ?? '')] = ($counts[(string) $row->answer][(string) ($row->sex ?? '')] ?? 0) + (int) $row->responses;
        }
        $details = [];
        foreach ($detailRows ?? [] as $row) {
            $details[(string) $row->answer][(string) $row->detail] = ($details[(string) $row->answer][(string) $row->detail] ?? 0) + (int) $row->responses;
        }

        return $this->fromCounts($key, $label, $options, $counts, fn (string $value): string => Str::headline($value), $group, $kind, $details, $detailLabels);
    }

    /**
     * @param  array<string, string>  $options
     * @param  array<string, array<string, int>>  $counts  answer → sex → responses
     * @param  callable(string): string  $fallback
     * @param  array<string, array<string, int>>  $details  answer → detail → responses
     * @param  array<string, string>  $detailLabels
     * @return Question
     */
    private function fromCounts(string $key, string $label, array $options, array $counts, callable $fallback, string $group = 'respondents', string $kind = 'choices', array $details = [], array $detailLabels = []): array
    {
        $values = array_values(array_unique([...array_keys($options), ...array_map(strval(...), array_keys($counts))]));
        $any = array_sum(array_map(array_sum(...), $counts)) > 0;

        return [
            'key' => $key,
            'label' => $label,
            'group' => $group === 'answers' ? 'answers' : 'respondents',
            'kind' => $kind === 'matrix' ? 'matrix' : 'choices',
            'options' => ! $any ? [] : array_map(function (string $value) use ($options, $counts, $fallback, $details, $detailLabels): array {
                $bySex = $counts[$value] ?? [];
                $perDetail = $details[$value] ?? [];
                arsort($perDetail);

                return [
                    'value' => $value,
                    'label' => $options[$value] ?? $fallback($value),
                    'count' => array_sum($bySex),
                    'female' => (int) ($bySex['female'] ?? 0),
                    'male' => (int) ($bySex['male'] ?? 0),
                    'details' => array_map(fn (string $detail, int $count): array => [
                        'value' => $detail,
                        'label' => $detailLabels[$detail] ?? Str::headline($detail),
                        'count' => $count,
                    ], array_map(strval(...), array_keys($perDetail)), array_values($perDetail)),
                ];
            }, $values),
        ];
    }

    /**
     * Responses per value of a tally column and sex.
     *
     * @param  'respondent_group'|'sex'  $column
     * @return array<string, array<string, int>>
     */
    private function groupedBySex(QueryBuilder $responses, string $column): array
    {
        $counts = [];
        foreach ($responses->groupBy("t.{$column}", 't.sex')->selectRaw("t.{$column} as value, t.sex as sex, sum(t.responses) as responses")->get() as $row) {
            $value = (string) ($row->value ?? 'not-given');
            $counts[$value][(string) ($row->sex ?? '')] = (int) $row->responses;
        }

        return $counts;
    }

    /**
     * One column's counts: every known value in the given order, even at
     * zero (so a chart's colours stay with their values), then any others,
     * and unanswered ("Not given") last.
     *
     * @param  'respondent_group'|'sex'  $column
     * @param  list<string>  $order
     * @param  callable(string): string  $label
     * @return Breakdown
     */
    private function breakdown(QueryBuilder $tallies, string $column, array $order, callable $label): array
    {
        $counts = $tallies
            ->groupBy("t.{$column}")
            ->selectRaw("t.{$column} as value, sum(t.responses) as responses")
            ->get()
            ->mapWithKeys(fn (stdClass $row): array => [(string) ($row->value ?? '') => (int) $row->responses])
            ->filter(fn (int $responses): bool => $responses > 0);
        $rank = fn (string $value): int => match (true) {
            $value === '' => count($order) + 1,
            in_array($value, $order, true) => (int) array_search($value, $order, true),
            default => count($order),
        };

        return array_values(collect($order)->merge($counts->keys())->unique()
            ->sortBy($rank)
            ->map(fn (string $value): array => [
                'value' => $value === '' ? 'not-given' : $value,
                'label' => $value === '' ? 'Not given' : $label($value),
                'responses' => (int) ($counts[$value] ?? 0),
            ])
            ->all());
    }

    /**
     * The active respondent groups in order, and every group's label.
     *
     * @return array{0: list<string>, 1: callable(string): string}
     */
    private function groupOrder(): array
    {
        $groups = SurveyRespondentGroup::query()->orderBy('sort_order')->get(['value', 'label', 'is_active']);
        $labels = $groups->pluck('label', 'value');

        return [
            array_values(array_map(strval(...), $groups->where('is_active', true)->pluck('value')->all())),
            fn (string $value): string => $value === 'not-given' ? 'Not given' : (string) ($labels[$value] ?? Str::headline($value)),
        ];
    }

    /**
     * The survey's questionnaire: the published version, or the newest.
     *
     * @return array<string, mixed>
     */
    private function definitionOf(Survey $survey): array
    {
        $version = $survey->publishedVersion() ?? $survey->versions()->latest('version')->first();

        return is_array($version?->definition) ? $version->definition : [];
    }

    /**
     * The sex question's choices, as value → label.
     *
     * @param  array<string, mixed>  $definition
     * @return array<string, string>
     */
    private function sexOptions(array $definition): array
    {
        foreach ($definition['sections'] ?? [] as $section) {
            foreach (is_array($section) ? $section['questions'] ?? [] : [] as $question) {
                if (is_array($question) && ($question['id'] ?? null) === 'sex') {
                    return $this->labels($question['options'] ?? []);
                }
            }
        }

        return array_combine(self::SEXES, array_map(fn (string $value): string => Str::ucfirst(str_replace('-', ' ', $value)), self::SEXES));
    }

    /**
     * Gender identities across both sexes, named in English (the forms add
     * Filipino in brackets).
     *
     * @return array<string, string>
     */
    private function genderIdentityLabels(): array
    {
        $labels = [];
        foreach (RespondentDetails::GENDER_IDENTITIES as $identities) {
            foreach ($identities as $value => $label) {
                $labels[$value] ??= trim((string) Str::before($label, ' ('));
            }
        }

        return $labels;
    }

    /**
     * A question's choices as value → label.
     *
     * @return array<string, string>
     */
    private function labels(mixed $options): array
    {
        $labels = [];
        foreach (is_array($options) ? $options : [] as $option) {
            if (is_array($option) && is_string($option['value'] ?? null)) {
                $labels[$option['value']] = (string) ($option['label'] ?? $option['value']);
            }
        }

        return $labels;
    }
}
