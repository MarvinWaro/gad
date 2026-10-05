import { Head } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import ChecklistResponseController from '@/actions/App/Http/Controllers/Admin/ChecklistResponseController';
import { ChecklistAnswers } from '@/components/monitoring/checklist-items';
import {
    EmptyList,
    FilterBar,
    NoOfficeNotice,
    OfficeScope,
    PlaceFilters,
    placeFilterCount,
    SearchFilter,
    useRecordFilters,
    YearFilter,
} from '@/components/record-filters';
import { localDate } from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type {
    ChecklistDefinition,
    ChecklistResponse,
    ChecklistResponsePage,
    DirectoryOption,
    ReportFilters,
} from '@/types/monitoring';

type Props = {
    checklist: ChecklistDefinition;
    responses: ChecklistResponsePage;
    filters: ReportFilters;
    academicYears: string[];
    hasOffice: boolean;
    regions: DirectoryOption[];
    heis: DirectoryOption[];
};

/** CHED's view of a GAD checklist: each HEI's answer, a year per row. */
export default function ChecklistResponses({
    checklist,
    responses,
    filters,
    academicYears,
    hasOffice,
    regions,
    heis,
}: Props) {
    const { values, loading, filtered, apply, change, search, pick } =
        useRecordFilters(
            ChecklistResponseController.index.url(checklist.type),
            filters,
        );
    const total = responses.meta.total;
    const noun = total === 1 ? 'answer' : 'answers';

    return (
        <>
            <Head title={checklist.name} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <p className="mb-2 text-sm text-muted-foreground">
                        Institutional reporting · CHED review
                    </p>
                    <h1 className="text-3xl font-medium tracking-tight">
                        {checklist.name}
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                        {checklist.title}
                    </p>
                </header>

                {!hasOffice && <NoOfficeNotice noun="answers" />}
                <OfficeScope noun="Answers" />

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter answers"
                        filters={1 + placeFilterCount(regions)}
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Institution name"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                        <YearFilter
                            value={values.academic_year ?? ''}
                            years={academicYears}
                            onChange={(value) =>
                                change({ ...values, academic_year: value })
                            }
                        />
                        <PlaceFilters
                            values={values}
                            onPick={pick}
                            regions={regions}
                            heis={heis}
                        />
                    </FilterBar>

                    <p role="status" className="sr-only">
                        {total} {noun}
                    </p>

                    {responses.data.length ? (
                        <div
                            aria-busy={loading}
                            className={cn(
                                'transition-opacity @4xl:grid @4xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(max-content,1fr))_auto] @4xl:gap-x-6',
                                loading && 'opacity-60',
                            )}
                        >
                            <div
                                aria-hidden
                                className="hidden border-b bg-muted/50 px-5 py-3 text-xs font-medium text-muted-foreground @4xl:col-span-full @4xl:grid @4xl:grid-cols-subgrid @4xl:gap-x-6"
                            >
                                <span>Institution</span>
                                <span>Academic year</span>
                                <span>Checked</span>
                                <span>Submitted</span>
                                <span />
                            </div>
                            <ul className="divide-y @4xl:col-span-full @4xl:grid @4xl:grid-cols-subgrid">
                                {responses.data.map((response) => (
                                    <ResponseRow
                                        key={response.id}
                                        response={response}
                                        checklist={checklist}
                                    />
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'No answers match these filters'
                                    : 'No answers yet'
                            }
                            text={
                                filtered
                                    ? 'Try another year or place, or clear the filters to see every answer.'
                                    : 'Answers from the institutions your office covers will appear here.'
                            }
                            onClear={() => change({})}
                        />
                    )}

                    {total > 0 && (
                        <Pagination
                            page={responses.meta}
                            label={noun}
                            persistent
                            className="sm:px-5"
                        />
                    )}
                </div>
            </div>
        </>
    );
}

/**
 * One HEI's answer: a table row on wide cards, a stacked summary on narrow
 * ones. "Answers" opens the checklist under it.
 */
function ResponseRow({
    response,
    checklist,
}: {
    response: ChecklistResponse;
    checklist: ChecklistDefinition;
}) {
    const { hei, region } = response.place;
    const place = region?.name;
    const count = response.items.length;
    const all = checklist.items.length;

    return (
        <Collapsible asChild>
            <li className="flex flex-col gap-3 px-4 py-4 sm:px-5 @4xl:col-span-full @4xl:grid @4xl:grid-cols-subgrid @4xl:items-center @4xl:gap-x-6">
                <div className="flex items-start justify-between gap-4 @4xl:contents">
                    <div className="min-w-0">
                        <p className="font-medium break-words">{hei?.name}</p>
                        {place && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {place}
                            </p>
                        )}
                    </div>
                    <p className="shrink-0 text-right tabular-nums @4xl:text-left">
                        {response.academic_year}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 @4xl:contents">
                    <p className="flex items-center gap-2.5 text-sm tabular-nums">
                        <span
                            aria-hidden
                            className="h-1.5 w-14 overflow-hidden rounded-full bg-muted"
                        >
                            <span
                                className="block h-full rounded-full bg-brand"
                                style={{ width: `${(count / all) * 100}%` }}
                            />
                        </span>
                        {count} of {all}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums @4xl:text-sm @4xl:whitespace-nowrap">
                        <span className="@4xl:sr-only">Submitted </span>
                        {localDate(response.submitted_at)}
                    </p>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="group/answers ml-auto @4xl:justify-self-end"
                        >
                            Answers
                            <span className="sr-only">
                                {' '}
                                of {hei?.name}, {response.academic_year}
                            </span>
                            <ChevronDown className="transition-transform group-data-[state=open]/answers:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                </div>
                {/* Contained, so its long lines never widen the columns. */}
                <CollapsibleContent className="[contain:inline-size] @4xl:col-span-full @4xl:mt-1">
                    <div className="rounded-lg bg-muted/50 p-4">
                        <ChecklistAnswers
                            items={checklist.items}
                            value={response.items}
                        />
                        {response.submitted_by && (
                            <p className="mt-4 text-xs text-muted-foreground">
                                Submitted by {response.submitted_by}
                            </p>
                        )}
                    </div>
                </CollapsibleContent>
            </li>
        </Collapsible>
    );
}
