import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { FeedbackRow } from '@/components/feedback/feedback-row';
import { FeedbackSummaryPanel } from '@/components/feedback/feedback-summary';
import { selectClass } from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import {
    EmptyList,
    Filter,
    FilterBar,
    PlaceFilters,
    placeFilterCount,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { cn } from '@/lib/utils';
import { exportMethod, index } from '@/routes/admin/feedback';
import type {
    FeedbackFilters,
    FeedbackQuestions,
    FeedbackSummary,
    FeedbackTypeOption,
    SiteFeedbackPage,
} from '@/types/feedback';
import type { DirectoryOption } from '@/types/monitoring';

type Props = {
    feedback: SiteFeedbackPage;
    summary: FeedbackSummary;
    questions: FeedbackQuestions;
    types: FeedbackTypeOption[];
    filters: FeedbackFilters;
    hasOffice: boolean;
    permissions: { export: boolean; delete: boolean };
    regions: DirectoryOption[];
    clusters: DirectoryOption[];
    heis: DirectoryOption[];
};

/**
 * Public site → Feedback: what visitors sent through the website feedback
 * form (/feedback), as far as the account's office reaches. The filters
 * apply to the figures and the list alike.
 */
export default function FeedbackIndex({
    feedback,
    summary,
    questions,
    types,
    filters,
    hasOffice,
    permissions,
    regions,
    clusters,
    heis,
}: Props) {
    const { values, loading, filtered, apply, change, search, pick } =
        useRecordFilters<FeedbackFilters>(index.url(), filters);
    const total = feedback.meta.total;
    const noun = total === 1 ? 'feedback response' : 'feedback responses';
    const query = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value),
    );

    return (
        <>
            <Head title="Website feedback" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="mb-2 text-sm text-muted-foreground">
                            Public site
                        </p>
                        <h1 className="text-3xl font-medium tracking-tight">
                            Website feedback
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                            What visitors send through the feedback form on the
                            public site. Feedback that names a region goes to
                            that region&rsquo;s office; feedback that names none
                            goes to every office.
                        </p>
                    </div>
                    {permissions.export && summary.total > 0 && (
                        <Button asChild variant="outline" className="shrink-0">
                            <a href={exportMethod.url({ query })}>
                                <Download />
                                Export CSV
                            </a>
                        </Button>
                    )}
                </header>

                {!hasOffice && (
                    <div
                        role="status"
                        className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm"
                    >
                        Your account has no office yet, so only feedback that
                        names no region is shown. A user manager can set your
                        office in Settings → Users.
                    </div>
                )}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter feedback"
                        filters={1 + placeFilterCount(regions, clusters)}
                        className="border-b-0"
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Feedback, name or email"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                        <Filter label="Type" id="type">
                            <FormSelect
                                id="type"
                                className={selectClass}
                                value={values.type ?? ''}
                                onChange={(type) => change({ ...values, type })}
                                placeholder="All types"
                                allowEmpty
                                options={types.map((type) => ({
                                    value: type.code,
                                    label: type.label,
                                }))}
                            />
                        </Filter>
                        <PlaceFilters
                            values={values}
                            onPick={pick}
                            regions={regions}
                            clusters={clusters}
                            heis={heis}
                        />
                    </FilterBar>
                </div>

                <div
                    aria-busy={loading}
                    className={cn(
                        'flex flex-col gap-4 transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    <FeedbackSummaryPanel
                        summary={summary}
                        questions={questions}
                        activeType={values.type ?? ''}
                        onType={(type) => change({ ...values, type })}
                    />

                    <section
                        className="overflow-hidden rounded-xl border bg-card"
                        aria-labelledby="feedback-list-title"
                    >
                        <h2
                            id="feedback-list-title"
                            className="border-b px-5 py-4 text-sm font-medium"
                        >
                            {total.toLocaleString()} {noun}
                        </h2>
                        <p role="status" className="sr-only">
                            {total} {noun}
                        </p>
                        {feedback.data.length > 0 ? (
                            <ul className="divide-y">
                                {feedback.data.map((item) => (
                                    <FeedbackRow
                                        key={item.id}
                                        feedback={item}
                                        questions={questions}
                                        canDelete={permissions.delete}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <EmptyList
                                filtered={filtered}
                                title={
                                    filtered
                                        ? 'No feedback matches these filters'
                                        : 'No feedback yet'
                                }
                                text={
                                    filtered
                                        ? 'Try another type or place, or clear the filters to see all feedback.'
                                        : 'Feedback appears here as visitors send it through the form on the public site.'
                                }
                                onClear={() => change({})}
                            />
                        )}
                        {total > 0 && (
                            <Pagination
                                page={feedback.meta}
                                label="feedback responses"
                                persistent
                                className="sm:px-5"
                            />
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}
