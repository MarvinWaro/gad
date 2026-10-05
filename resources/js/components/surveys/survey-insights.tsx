import { Building2, ClipboardList, Globe, Venus } from 'lucide-react';
import {
    ActivityChart,
    RespondentsChart,
} from '@/components/dashboard/dashboard-charts';
import { DashboardFilterBar } from '@/components/dashboard/dashboard-filters';
import { NoOfficeNotice } from '@/components/record-filters';
import { RankedBars } from '@/components/surveys/ranked-bars';
import { Skeleton } from '@/components/ui/skeleton';
import { changeLabel, formatCount, percentOf } from '@/lib/dashboard';
import { index, summary } from '@/routes/admin/surveys';
import type {
    SurveyInsightFilters,
    SurveyInsights,
} from '@/types/survey-insights';

/**
 * The Surveys page's insights, above the library: how the law surveys are
 * going, for the places the account's office covers, with the dashboard's
 * filters. Counts only; nothing about any one respondent
 * (docs/survey-analytics.md).
 */
export function SurveyInsightsSection({
    insights,
    filters,
}: {
    /** Deferred: arrives just after the page. */
    insights?: SurveyInsights;
    filters: SurveyInsightFilters;
}) {
    return (
        <section aria-labelledby="insights-title" className="space-y-4">
            <div>
                <h2 id="insights-title" className="text-lg font-medium">
                    Survey insights
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Who answers the law surveys, and from where. Counts only:
                    respondents stay anonymous.
                </p>
            </div>
            {!filters.hasOffice && <NoOfficeNotice noun="figures" />}
            {insights && (
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span
                            className="size-2 rounded-full bg-brand"
                            aria-hidden="true"
                        />
                        <span className="font-medium">
                            {insights.scope.label}
                        </span>
                        <span className="text-muted-foreground">
                            / {insights.period.label}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {insights.period.range} · Philippine time · updated
                        within a minute
                    </p>
                </div>
            )}
            <DashboardFilterBar
                filters={filters.filters}
                options={filters.options}
                url={index.url()}
            />
            {insights ? (
                <InsightFigures insights={insights} />
            ) : (
                <div aria-busy="true" className="space-y-4">
                    <p role="status" className="sr-only">
                        Loading survey insights
                    </p>
                    <Skeleton className="h-36 rounded-xl" />
                    <div className="grid gap-4 xl:grid-cols-12">
                        <Skeleton className="h-80 rounded-xl xl:col-span-8" />
                        <Skeleton className="h-80 rounded-xl xl:col-span-4" />
                    </div>
                </div>
            )}
        </section>
    );
}

function InsightFigures({ insights }: { insights: SurveyInsights }) {
    const { kpis, period, respondents, laws, places } = insights;
    const total = kpis.responses.value;
    const sex = (value: string) =>
        respondents.sexes.find((row) => row.value === value)?.responses ?? 0;
    const female = sex('female');

    return (
        <>
            <dl
                aria-label="Survey figures"
                className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card xl:grid-cols-4"
            >
                {[
                    {
                        label: 'Responses',
                        value: formatCount(total),
                        icon: ClipboardList,
                        note: changeLabel(kpis.responses, period.comparison),
                        detail: `Across ${laws.length} law ${laws.length === 1 ? 'survey' : 'surveys'}`,
                    },
                    {
                        label: 'Participating HEIs',
                        value: formatCount(kpis.participation.participating),
                        icon: Building2,
                        note: `${percentOf(kpis.participation.participating, kpis.participation.total)}% of the network`,
                        detail: `Of ${formatCount(kpis.participation.total)} active HEIs`,
                    },
                    {
                        label: 'Female respondents',
                        value: `${percentOf(female, total)}%`,
                        icon: Venus,
                        note: `${formatCount(female)} female · ${formatCount(sex('male'))} male`,
                        detail: 'Of the responses in view',
                    },
                    {
                        label: 'Live surveys',
                        value: formatCount(kpis.live),
                        icon: Globe,
                        note:
                            kpis.live === 0
                                ? 'None open to the public yet'
                                : 'Open to the public now',
                        detail: 'Published and not archived',
                    },
                ].map(({ label, value, icon: Icon, note, detail }) => (
                    <div
                        key={label}
                        className="border-b p-4 odd:border-r sm:p-5 xl:border-r xl:border-b-0 xl:p-6 xl:last:border-r-0 [&:nth-last-child(-n+2)]:border-b-0"
                    >
                        <dt className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                            {label}
                            <Icon aria-hidden="true" className="size-4" />
                        </dt>
                        <dd className="mt-3 text-4xl leading-none font-medium tracking-tight tabular-nums">
                            {value}
                        </dd>
                        <dd className="mt-3 text-xs font-medium text-brand">
                            {note}
                        </dd>
                        <dd className="mt-1 text-xs text-muted-foreground">
                            {detail}
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                <div className="min-w-0 md:col-span-2 xl:col-span-8">
                    <ActivityChart
                        trend={insights.trend}
                        totals={{ responses: total }}
                        range={period.range}
                        shown={['responses']}
                        title="Responses over time"
                        description="Answers to the law surveys, by the day they arrived."
                    />
                </div>
                <RespondentsChart respondents={respondents} total={total} />

                <section
                    aria-labelledby="laws-title"
                    className="min-w-0 rounded-xl border bg-card p-5 sm:p-6 xl:col-span-6"
                >
                    <h3 id="laws-title" className="text-lg font-medium">
                        Responses by law
                    </h3>
                    <p className="mt-1 mb-5 text-sm text-muted-foreground">
                        Open a law to see how its questions were answered.
                    </p>
                    <RankedBars
                        total={total}
                        unit="responses"
                        rows={laws.map((law) => ({
                            key: String(law.id),
                            label: law.code,
                            note: law.title,
                            count: law.responses,
                            href: summary.url(law.id),
                        }))}
                    />
                </section>

                <section
                    aria-labelledby="places-title"
                    className="min-w-0 rounded-xl border bg-card p-5 sm:p-6 xl:col-span-6"
                >
                    <h3 id="places-title" className="text-lg font-medium">
                        {places.level === 'region'
                            ? 'Where responses come from'
                            : 'HEIs with the most responses'}
                    </h3>
                    <p className="mt-1 mb-5 text-sm text-muted-foreground">
                        {places.level === 'region'
                            ? 'Responses by the region respondents chose.'
                            : places.total > places.rows.length
                              ? `The top ${places.rows.length} of ${formatCount(places.total)} HEIs with responses.`
                              : 'Every HEI with responses in view.'}
                    </p>
                    {places.rows.length === 0 ? (
                        <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                            No responses in this period yet. Places appear here
                            as people answer the law surveys.
                        </p>
                    ) : (
                        <RankedBars
                            total={total}
                            unit="responses"
                            rows={places.rows.map((row) => ({
                                key: String(row.id ?? 'none'),
                                label: row.name,
                                count: row.responses,
                            }))}
                        />
                    )}
                </section>
            </div>
        </>
    );
}
