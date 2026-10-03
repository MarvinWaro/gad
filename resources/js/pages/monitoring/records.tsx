import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import MonitoringReviewController from '@/actions/App/Http/Controllers/Admin/MonitoringReviewController';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import {
    EmptyList,
    Filter,
    FilterBar,
    NoOfficeNotice,
    PlaceFilters,
    placeFilterCount,
    SearchFilter,
    useRecordFilters,
    YearFilter,
} from '@/components/record-filters';
import {
    localDate,
    periodLabel,
    selectClass,
    semesterLabel,
    semesterOptions,
    StagePill,
    statusOptions,
} from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { stageOf } from '@/lib/monitoring-draft';
import { cn } from '@/lib/utils';
import type {
    DirectoryOption,
    MonitoringPage,
    MonitoringReport,
    ReportFilters,
} from '@/types/monitoring';

type Props = {
    reports: MonitoringPage;
    filters: ReportFilters;
    academicYears: string[];
    staff?: boolean;
    canCreate: boolean;
    hasOffice?: boolean;
    regions?: DirectoryOption[];
    heis?: DirectoryOption[];
};

export default function Records({
    reports,
    filters,
    academicYears,
    staff = false,
    canCreate,
    hasOffice = true,
    regions = [],
    heis = [],
}: Props) {
    const { values, loading, filtered, apply, change, search, pick } =
        useRecordFilters(
            staff
                ? MonitoringReviewController.index.url()
                : MonitoringController.records.url(),
            filters,
        );
    const total = reports.meta.total;
    const noun = total === 1 ? 'report' : 'reports';

    return (
        <>
            <Head title={staff ? 'Monitoring reports' : 'Records'} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            {staff
                                ? 'Institutional reporting · CHED review'
                                : 'Your institution’s submissions'}
                        </p>
                        <h1 className="text-3xl font-medium tracking-tight">
                            {staff ? 'Monitoring reports' : 'Records'}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {staff
                                ? 'Review the reports institutions send from the regions your office covers.'
                                : 'Continue drafts, follow CHED’s reviews, and see what you submitted.'}
                        </p>
                    </div>
                    {canCreate && (
                        <Button asChild>
                            <Link href={MonitoringController.create.url()}>
                                <Plus />
                                Monitoring report
                            </Link>
                        </Button>
                    )}
                </header>

                {staff && !hasOffice && <NoOfficeNotice noun="reports" />}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter reports"
                        filters={3 + (staff ? placeFilterCount(regions) : 0)}
                    >
                        {staff && (
                            <SearchFilter
                                value={values.search ?? ''}
                                placeholder="Institution name"
                                onSearch={search}
                                onSubmit={() => apply(values)}
                            />
                        )}
                        <YearFilter
                            value={values.academic_year ?? ''}
                            years={academicYears}
                            onChange={(value) =>
                                change({ ...values, academic_year: value })
                            }
                        />
                        <Filter label="Semester" id="semester">
                            <FormSelect
                                id="semester"
                                className={selectClass}
                                value={values.semester ?? ''}
                                onChange={(value) =>
                                    change({ ...values, semester: value })
                                }
                                placeholder="All semesters"
                                allowEmpty
                                options={semesterOptions}
                            />
                        </Filter>
                        <Filter label="Status" id="status">
                            <FormSelect
                                id="status"
                                className={selectClass}
                                value={values.status ?? ''}
                                onChange={(value) =>
                                    change({ ...values, status: value })
                                }
                                placeholder="All statuses"
                                allowEmpty
                                options={statusOptions}
                            />
                        </Filter>
                        {staff && (
                            <PlaceFilters
                                values={values}
                                onPick={pick}
                                regions={regions}
                                heis={heis}
                            />
                        )}
                    </FilterBar>

                    <p role="status" className="sr-only">
                        {total} {noun}
                    </p>

                    {reports.data.length ? (
                        <div
                            aria-busy={loading}
                            className={cn(
                                'transition-opacity @4xl:grid @4xl:gap-x-6',
                                staff
                                    ? '@4xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(max-content,1fr))_auto]'
                                    : '@4xl:grid-cols-[minmax(0,2fr)_repeat(2,minmax(max-content,1fr))_auto]',
                                loading && 'opacity-60',
                            )}
                        >
                            <div
                                aria-hidden
                                className="hidden border-b bg-muted/50 px-5 py-3 text-xs font-medium text-muted-foreground @4xl:col-span-full @4xl:grid @4xl:grid-cols-subgrid @4xl:gap-x-6"
                            >
                                {staff && <span>Institution</span>}
                                <span>Period</span>
                                <span>Status</span>
                                <span>Last updated</span>
                                <span />
                            </div>
                            <ul className="divide-y @4xl:col-span-full @4xl:grid @4xl:grid-cols-subgrid">
                                {reports.data.map((report) => (
                                    <ReportRow
                                        key={report.id}
                                        report={report}
                                        staff={staff}
                                    />
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'No reports match these filters'
                                    : 'No reports yet'
                            }
                            text={
                                filtered
                                    ? 'Try another year, status or place, or clear the filters to see every report.'
                                    : canCreate
                                      ? 'Start a monitoring report and it will be kept here.'
                                      : 'Reports from the institutions your office covers will appear here.'
                            }
                            onClear={() => change({})}
                        />
                    )}

                    {total > 0 && (
                        <Pagination
                            page={reports.meta}
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
 * One report: a table row on wide cards, a stacked summary on narrow ones.
 * The action link stretches over the whole row, so any part of it opens the
 * report.
 */
function ReportRow({
    report,
    staff,
}: {
    report: MonitoringReport;
    staff: boolean;
}) {
    const place = report.place.region?.name;
    const revision = report.current?.number ?? 1;
    const action =
        report.abilities.edit || report.abilities.sign
            ? 'Continue'
            : report.abilities.review
              ? 'Review'
              : 'View';

    return (
        <li className="relative flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-muted/40 has-[a:focus-visible]:bg-muted/40 sm:px-5 @4xl:col-span-full @4xl:grid @4xl:grid-cols-subgrid @4xl:items-center @4xl:gap-x-6">
            <div className="flex items-start justify-between gap-4 @4xl:contents">
                {staff && (
                    <div className="min-w-0">
                        <p className="font-medium break-words">
                            {report.place.hei.name}
                        </p>
                        {place && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {place}
                            </p>
                        )}
                    </div>
                )}
                <div
                    className={cn(
                        'shrink-0',
                        staff && 'text-right @4xl:text-left',
                    )}
                >
                    <p className={cn('tabular-nums', !staff && 'font-medium')}>
                        {report.academic_year}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {semesterLabel(report.semester)}
                        {revision > 1 && ` · Revision ${revision}`}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 @4xl:contents">
                <div>
                    <StagePill stage={stageOf(report)} />
                </div>
                <p className="text-xs text-muted-foreground tabular-nums @4xl:text-sm @4xl:whitespace-nowrap">
                    <span className="@4xl:sr-only">Updated </span>
                    {localDate(report.updated_at)}
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="ml-auto @4xl:justify-self-end"
                >
                    <Link
                        href={MonitoringController.show.url(report.id)}
                        className="after:absolute after:inset-0"
                    >
                        {action}
                        <span className="sr-only">
                            {' '}
                            {staff && `${report.place.hei.name}, `}
                            {periodLabel(report)} report
                        </span>
                        <ArrowUpRight />
                    </Link>
                </Button>
            </div>
        </li>
    );
}
