import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import {
    PeriodFilters,
    periodFilterCount,
} from '@/components/dashboard/dashboard-filters';
import { selectClass } from '@/components/monitoring/shared';
import {
    Filter,
    FilterBar,
    NoOfficeNotice,
    PlaceFilters,
    placeFilterCount,
    useRecordFilters,
} from '@/components/record-filters';
import { StatTile } from '@/components/stat-tile';
import { AnswerCard } from '@/components/surveys/answer-card';
import { SurveyTabs } from '@/components/surveys/survey-tabs';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { formatCount, percentOf } from '@/lib/dashboard';
import { index, summary } from '@/routes/admin/surveys';
import type { SummaryFilters, SurveySummary } from '@/types/survey-insights';

/**
 * A survey's Summary, like Google Forms': every question's answers as bars,
 * split by sex, for the places the account's office covers. With fewer than
 * `minResponses` responses in view only the totals show, so no one can be
 * picked out of a small group (docs/survey-analytics.md).
 */
export default function SurveySummaryPage(props: SurveySummary) {
    const { survey, period, scope, totals, suppressed, questions } = props;
    // Null when only a few responses are in view, so they are not counted out.
    const fewerThan = `Fewer than ${props.minResponses}`;
    const responses = totals.responses ?? 0;
    const answers = questions.filter(
        (question) => question.group === 'answers',
    );
    const about = questions.filter(
        (question) => question.group === 'respondents',
    );

    return (
        <>
            <Head title={`${survey.code} summary`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <Button asChild variant="ghost" className="-ml-3">
                        <Link href={index.url()}>
                            <ArrowLeft />
                            Back to surveys
                        </Link>
                    </Button>
                    <h1 className="mt-3 text-2xl font-semibold">
                        {survey.code} summary
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {survey.law_title}. How its questions were answered:
                        counts only, respondents stay anonymous.
                    </p>
                </div>
                <SurveyTabs surveyId={survey.id} current="summary" />

                {!props.hasOffice && <NoOfficeNotice noun="figures" />}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span
                            className="size-2 rounded-full bg-brand"
                            aria-hidden="true"
                        />
                        <span className="font-medium">{scope.label}</span>
                        <span className="text-muted-foreground">
                            / {period.label}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {period.range} · Philippine time
                    </p>
                </div>
                <SummaryFilterBar {...props} />

                <dl
                    aria-label="Responses in view"
                    className="grid gap-4 sm:grid-cols-3"
                >
                    <StatTile
                        label="Responses"
                        value={
                            totals.responses === null
                                ? fewerThan
                                : formatCount(totals.responses)
                        }
                        note="With the filters above"
                    />
                    <StatTile
                        label="HEIs"
                        value={formatCount(totals.heis)}
                        note="That respondents named"
                    />
                    <StatTile
                        label="Female respondents"
                        value={
                            totals.female === null
                                ? 'Not shown'
                                : `${percentOf(totals.female, responses)}%`
                        }
                        note={
                            totals.female === null
                                ? 'Too few responses to split'
                                : `${formatCount(totals.female)} female · ${formatCount(totals.male ?? 0)} male`
                        }
                    />
                </dl>

                {suppressed ? (
                    <div
                        role="status"
                        className="flex items-start gap-4 rounded-xl border bg-muted p-5"
                    >
                        <ShieldCheck
                            aria-hidden="true"
                            className="mt-0.5 size-5 shrink-0 text-brand"
                        />
                        <div>
                            <p className="font-medium">
                                {totals.responses === 0
                                    ? 'No responses in view yet'
                                    : 'Too few responses to show answers'}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {totals.responses === 0
                                    ? 'Answers appear here once people answer this survey within these filters.'
                                    : `Answers show once at least ${props.minResponses} responses are in view, so no one can be picked out of a small group. Widen the filters to see them.`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {answers.length > 0 && (
                            <section
                                aria-labelledby="answers-title"
                                className="space-y-4"
                            >
                                <h2
                                    id="answers-title"
                                    className="text-lg font-medium"
                                >
                                    Answers
                                </h2>
                                {answers.map((question) => (
                                    <AnswerCard
                                        key={question.key}
                                        question={question}
                                        respondents={responses}
                                    />
                                ))}
                            </section>
                        )}
                        <section
                            aria-labelledby="about-title"
                            className="space-y-4"
                        >
                            <h2
                                id="about-title"
                                className="text-lg font-medium"
                            >
                                About the respondents
                            </h2>
                            <div className="grid gap-4 lg:grid-cols-2">
                                {about.map((question) => (
                                    <AnswerCard
                                        key={question.key}
                                        question={question}
                                        respondents={responses}
                                    />
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </>
    );
}

/**
 * The period and places, then the respondents' sex and group. They apply
 * as soon as they change.
 */
function SummaryFilterBar({ survey, filters, options }: SurveySummary) {
    const { values, change, pick } = useRecordFilters<SummaryFilters>(
        summary.url(survey.id),
        filters,
    );
    const set = (key: keyof SummaryFilters, value: string) =>
        change({ ...values, [key]: value });

    return (
        <div className="@container overflow-hidden rounded-xl border bg-card">
            <FilterBar
                label="Summary filters"
                filters={
                    periodFilterCount(values) +
                    placeFilterCount(options.regions) +
                    2
                }
                className="border-b-0"
            >
                <PeriodFilters
                    values={values}
                    filters={filters}
                    academicYears={options.academicYears}
                    change={change}
                />
                <PlaceFilters
                    values={values}
                    onPick={pick}
                    regions={options.regions}
                    heis={options.heis}
                />
                <Filter label="Sex at birth" id="sex">
                    <FormSelect
                        id="sex"
                        className={selectClass}
                        value={values.sex}
                        onChange={(value) => set('sex', value)}
                        placeholder="Every sex"
                        allowEmpty
                        emptyLabel="Every sex"
                        options={Object.entries(options.sexes).map(
                            ([value, label]) => ({ value, label }),
                        )}
                    />
                </Filter>
                <Filter label="Respondent group" id="respondent-group">
                    <FormSelect
                        id="respondent-group"
                        className={selectClass}
                        value={values.respondent_group}
                        onChange={(value) => set('respondent_group', value)}
                        placeholder="Every group"
                        allowEmpty
                        emptyLabel="Every group"
                        options={options.groups}
                    />
                </Filter>
            </FilterBar>
        </div>
    );
}
