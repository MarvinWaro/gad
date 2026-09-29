import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, FileText, Plus } from 'lucide-react';
import { useState } from 'react';
import MonitoringReviewController from '@/actions/App/Http/Controllers/Admin/MonitoringReviewController';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import {
    Field,
    fieldClass,
    localDate,
    Pagination,
    periodLabel,
    StagePill,
    statusOptions,
} from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { stageOf } from '@/lib/monitoring-draft';
import type {
    DirectoryOption,
    MonitoringPage,
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
    const path = staff
        ? MonitoringReviewController.index.url()
        : MonitoringController.records.url();
    // A regional office has its one region; only the Central Office picks.
    const pickRegion = regions.length > 1;
    const places = [
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
            key: 'cluster' as const,
            label: 'Cluster',
            all: 'All clusters',
            options: clusters,
        },
        { key: 'hei' as const, label: 'HEI', all: 'All HEIs', options: heis },
    ];

    function apply(next: ReportFilters) {
        router.get(
            path,
            Object.fromEntries(
                Object.entries(next).filter(([, value]) => value),
            ),
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <>
            <Head title={staff ? 'Monitoring reports' : 'Records'} />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-8">
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

                {!staff && (
                    <div className="flex flex-wrap gap-5 border-b pb-3 text-sm">
                        <span className="font-medium text-brand">
                            Monitoring
                        </span>
                        <span className="text-muted-foreground">
                            Training Survey · Soon
                        </span>
                        <span className="text-muted-foreground">
                            Compliance Survey · Soon
                        </span>
                    </div>
                )}

                {staff && !hasOffice && (
                    <div
                        role="status"
                        className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm"
                    >
                        Your account has no office yet, so no reports are shown.
                        A user manager can set your office in Settings → Users.
                    </div>
                )}

                <form
                    className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply(values);
                    }}
                >
                    {staff && (
                        <Field label="Search institution" id="search">
                            <input
                                id="search"
                                type="search"
                                className={fieldClass}
                                value={values.search ?? ''}
                                onChange={(event) =>
                                    setValues({
                                        ...values,
                                        search: event.target.value,
                                    })
                                }
                            />
                        </Field>
                    )}
                    <Field label="Academic year" id="year">
                        <select
                            id="year"
                            className={fieldClass}
                            value={values.academic_year ?? ''}
                            onChange={(event) =>
                                setValues({
                                    ...values,
                                    academic_year: event.target.value,
                                })
                            }
                        >
                            <option value="">All academic years</option>
                            {academicYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Semester" id="semester">
                        <select
                            id="semester"
                            className={fieldClass}
                            value={values.semester ?? ''}
                            onChange={(event) =>
                                setValues({
                                    ...values,
                                    semester: event.target.value,
                                })
                            }
                        >
                            <option value="">All semesters</option>
                            <option value="1">First Semester</option>
                            <option value="2">Second Semester</option>
                        </select>
                    </Field>
                    <Field label="Status" id="status">
                        <select
                            id="status"
                            className={fieldClass}
                            value={values.status ?? ''}
                            onChange={(event) =>
                                setValues({
                                    ...values,
                                    status: event.target.value,
                                })
                            }
                        >
                            <option value="">All statuses</option>
                            {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </Field>
                    {staff &&
                        places.map(({ key, label, all, options }) => (
                            <Field key={key} label={label} id={key}>
                                <select
                                    id={key}
                                    className={fieldClass}
                                    disabled={options.length === 0}
                                    value={values[key] ?? ''}
                                    onChange={(event) => {
                                        const next = {
                                            ...values,
                                            [key]: event.target.value,
                                            ...(key === 'region'
                                                ? { cluster: '', hei: '' }
                                                : key === 'cluster'
                                                  ? { hei: '' }
                                                  : {}),
                                        };
                                        setValues(next);
                                        // Picking a place loads the next list.
                                        apply(next);
                                    }}
                                >
                                    <option value="">{all}</option>
                                    {options.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        ))}
                    <div className="flex items-end gap-2">
                        <Button type="submit" variant="outline">
                            Apply filters
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setValues({});
                                apply({});
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </form>

                <p className="text-sm text-muted-foreground" role="status">
                    {reports.meta.total}{' '}
                    {reports.meta.total === 1 ? 'report' : 'reports'}
                </p>

                {reports.data.length ? (
                    <ul className="space-y-3">
                        {reports.data.map((report) => (
                            <li
                                key={report.id}
                                className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center gap-3">
                                        <h2 className="text-lg font-medium">
                                            {periodLabel(report)}
                                        </h2>
                                        <StagePill stage={stageOf(report)} />
                                    </div>
                                    <p className="text-sm break-words">
                                        {report.place.hei.name}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {[
                                            report.place.cluster?.name,
                                            report.place.region?.name,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        {report.current &&
                                            report.current.number > 1 &&
                                            ` · Revision ${report.current.number}`}
                                    </p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Updated {localDate(report.updated_at)}
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link
                                        href={MonitoringController.show.url(
                                            report.id,
                                        )}
                                    >
                                        {report.abilities.edit ||
                                        report.abilities.sign
                                            ? 'Continue'
                                            : report.abilities.review
                                              ? 'Review'
                                              : 'View'}
                                        <span className="sr-only">
                                            {' '}
                                            {periodLabel(report)} report
                                        </span>
                                        <ArrowUpRight />
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="rounded-xl border border-dashed px-6 py-16 text-center">
                        <FileText
                            aria-hidden
                            className="mx-auto mb-4 size-8 text-muted-foreground"
                        />
                        <h2 className="text-lg font-medium">
                            No reports to show
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {canCreate
                                ? 'Start a monitoring report, or change the filters.'
                                : 'Reports that match your office and filters will appear here.'}
                        </p>
                    </div>
                )}

                <Pagination
                    prev={reports.links.prev}
                    next={reports.links.next}
                    page={reports.meta.current_page}
                    last={reports.meta.last_page}
                />
            </div>
        </>
    );
}
