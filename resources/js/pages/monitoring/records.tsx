import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, FileText, Plus, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import MonitoringReviewController from '@/actions/App/Http/Controllers/Admin/MonitoringReviewController';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import { HeiCombobox } from '@/components/hei-combobox';
import {
    fieldClass,
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
    clusters?: DirectoryOption[];
    heis?: DirectoryOption[];
};

type PlaceKey = 'region' | 'cluster' | 'hei';

/** How long typing pauses before the search runs. */
const SEARCH_DELAY = 350;

export default function Records({
    reports,
    filters,
    academicYears,
    staff = false,
    canCreate,
    hasOffice = true,
    regions = [],
    clusters = [],
    heis = [],
}: Props) {
    const [values, setValues] = useState<ReportFilters>(filters);
    const [loading, setLoading] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const path = staff
        ? MonitoringReviewController.index.url()
        : MonitoringController.records.url();
    // A regional office has its one region; only the Central Office picks.
    const pickRegion = regions.length > 1;
    const places: {
        key: PlaceKey;
        label: string;
        all: string;
        options: DirectoryOption[];
        /** The place that has to be chosen before this list fills. */
        parent?: PlaceKey;
    }[] = [
        ...(pickRegion
            ? [
                  {
                      key: 'region' as const,
                      label: 'Region',
                      all: 'All regions',
                      options: regions,
                  },
              ]
            : []),
        {
            key: 'cluster',
            label: 'Cluster',
            all: 'All clusters',
            options: clusters,
            parent: pickRegion ? 'region' : undefined,
        },
        {
            key: 'hei',
            label: 'HEI',
            all: 'All HEIs',
            options: heis,
            parent: 'cluster',
        },
    ];
    const filtered = Object.values(filters).some(Boolean);
    const total = reports.meta.total;
    const noun = total === 1 ? 'report' : 'reports';

    useEffect(() => () => clearTimeout(searchTimer.current), []);

    /** Filters apply as soon as they change, starting again from page 1. */
    function apply(next: ReportFilters) {
        clearTimeout(searchTimer.current);
        router.get(
            path,
            Object.fromEntries(
                Object.entries({ ...next, search: next.search?.trim() }).filter(
                    ([, value]) => value,
                ),
            ),
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    }

    function change(next: ReportFilters) {
        setValues(next);
        apply(next);
    }

    function search(text: string) {
        const next = { ...values, search: text };
        setValues(next);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => apply(next), SEARCH_DELAY);
    }

    /** Picking a place clears the places below it. */
    function pick(key: PlaceKey, value: string) {
        change({
            ...values,
            [key]: value,
            ...(key === 'region'
                ? { cluster: '', hei: '' }
                : key === 'cluster'
                  ? { hei: '' }
                  : {}),
        });
    }

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

                {/* The three reports of the old PHLGADIS, for HEIs and CHED alike. */}
                <div className="flex flex-wrap gap-5 border-b pb-3 text-sm">
                    <span className="font-medium text-brand">Monitoring</span>
                    <span className="text-muted-foreground">
                        Training Survey · Soon
                    </span>
                    <span className="text-muted-foreground">
                        Compliance Survey · Soon
                    </span>
                </div>

                {staff && !hasOffice && (
                    <div
                        role="status"
                        className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm"
                    >
                        Your account has no office yet, so no reports are shown.
                        A user manager can set your office in Settings → Users.
                    </div>
                )}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <div
                        role="group"
                        aria-label="Filter reports"
                        className={cn(
                            // One row when the card is wide enough; otherwise
                            // search, period and status, then the places.
                            'grid grid-cols-2 gap-3 border-b p-4 sm:p-5 @3xl:grid-cols-4 @7xl:auto-cols-fr @7xl:grid-flow-col @7xl:grid-cols-none',
                            // Two to a row on phones; a filter left alone
                            // takes the whole row so its text isn't cut.
                            (3 + (staff ? places.length : 0)) % 2 === 1 &&
                                '*:last:col-span-2 @3xl:*:last:col-span-1',
                        )}
                    >
                        {staff && (
                            <form
                                role="search"
                                className="col-span-2 @3xl:col-span-1"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    apply(values);
                                }}
                            >
                                <Filter label="Search" id="search">
                                    <div className="relative">
                                        <Search
                                            aria-hidden
                                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                        />
                                        <input
                                            id="search"
                                            type="search"
                                            autoComplete="off"
                                            maxLength={150}
                                            placeholder="Institution name"
                                            className={cn(fieldClass, 'pl-9')}
                                            value={values.search ?? ''}
                                            onChange={(event) =>
                                                search(event.target.value)
                                            }
                                        />
                                    </div>
                                </Filter>
                            </form>
                        )}
                        <Filter label="Academic year" id="year">
                            <FormSelect
                                id="year"
                                className={selectClass}
                                value={values.academic_year ?? ''}
                                onChange={(value) =>
                                    change({ ...values, academic_year: value })
                                }
                                placeholder="All years"
                                allowEmpty
                                options={academicYears.map((year) => ({
                                    value: year,
                                    label: year,
                                }))}
                            />
                        </Filter>
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
                        {staff &&
                            places.map(
                                ({ key, label, all, options, parent }) => {
                                    const waiting =
                                        options.length === 0 &&
                                        parent !== undefined &&
                                        !values[parent];
                                    const placeholder = waiting
                                        ? `Choose a ${parent} first`
                                        : all;

                                    return (
                                        <Filter
                                            key={key}
                                            label={label}
                                            id={key}
                                        >
                                            {key === 'hei' ? (
                                                <HeiCombobox
                                                    id={key}
                                                    className="rounded-md bg-background"
                                                    disabled={
                                                        options.length === 0
                                                    }
                                                    value={values.hei ?? ''}
                                                    onChange={(value) =>
                                                        pick(key, value)
                                                    }
                                                    options={options}
                                                    placeholder={placeholder}
                                                    allowClear
                                                    clearLabel={all}
                                                />
                                            ) : (
                                                <FormSelect
                                                    id={key}
                                                    className={selectClass}
                                                    disabled={
                                                        options.length === 0
                                                    }
                                                    value={values[key] ?? ''}
                                                    onChange={(value) =>
                                                        pick(key, value)
                                                    }
                                                    placeholder={placeholder}
                                                    allowEmpty
                                                    emptyLabel={all}
                                                    options={options.map(
                                                        (option) => ({
                                                            value: String(
                                                                option.id,
                                                            ),
                                                            label: option.name,
                                                        }),
                                                    )}
                                                />
                                            )}
                                        </Filter>
                                    );
                                },
                            )}
                    </div>

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
                        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <FileText
                                    aria-hidden
                                    className="size-5 text-muted-foreground"
                                />
                            </span>
                            <h2 className="mt-4 font-medium">
                                {filtered
                                    ? 'No reports match these filters'
                                    : 'No reports yet'}
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                {filtered
                                    ? 'Try another year, status or place, or clear the filters to see every report.'
                                    : canCreate
                                      ? 'Start a monitoring report and it will be kept here.'
                                      : 'Reports from the institutions your office covers will appear here.'}
                            </p>
                            {filtered && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-5"
                                    onClick={() => change({})}
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
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

/** A filter's small label over its control. */
function Filter({
    label,
    id,
    children,
}: {
    label: string;
    id: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0">
            <label
                htmlFor={id}
                className="mb-1.5 block text-xs text-muted-foreground"
            >
                {label}
            </label>
            {children}
        </div>
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
    const place = [report.place.cluster?.name, report.place.region?.name]
        .filter(Boolean)
        .join(' · ');
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
