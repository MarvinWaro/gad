import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, FileText, Plus, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
    Field,
    fieldClass,
    localDate,
    Pagination,
    Status,
    statusLabels,
} from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import type {
    DirectoryOption,
    MonitoringPage,
    ReportFilters,
} from '@/types/monitoring';

type Props = {
    reports: MonitoringPage;
    filters: ReportFilters;
    staff?: boolean;
    canCreate: boolean;
    assigned?: boolean;
    canManageAccess?: boolean;
    regions?: DirectoryOption[];
    clusters?: DirectoryOption[];
    heis?: DirectoryOption[];
};
export default function Records({
    reports,
    filters,
    staff = false,
    canCreate,
    assigned = true,
    canManageAccess,
    regions = [],
    clusters = [],
    heis = [],
}: Props) {
    const [values, setValues] = useState<ReportFilters>(filters);
    const path = staff ? '/admin/monitoring' : '/records';
    const apply = (next: ReportFilters) =>
        router.get(
            path,
            Object.fromEntries(
                Object.entries(next).filter(([, value]) => value),
            ),
            { preserveScroll: true },
        );
    return (
        <>
            <Head title={staff ? 'Monitoring Reports' : 'Records'} />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-8">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            {staff
                                ? 'Institutional reporting · CHED review'
                                : 'Your institution’s submissions'}
                        </p>
                        <h1 className="text-3xl font-medium">
                            {staff ? 'Monitoring Reports' : 'Records'}
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {staff
                                ? 'Review the work submitted by institutions in your assigned regions.'
                                : 'Resume drafts, follow reviews, and download your submitted reports.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canManageAccess && (
                            <Button variant="outline" asChild>
                                <Link href="/admin/monitoring/access">
                                    <SlidersHorizontal />
                                    Reviewer access
                                </Link>
                            </Button>
                        )}
                        {canCreate && (
                            <Button asChild>
                                <Link href="/monitoring">
                                    <Plus />
                                    Monitoring Report
                                </Link>
                            </Button>
                        )}
                    </div>
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
                {!assigned && (
                    <div
                        role="status"
                        className="rounded-lg border bg-muted p-4 text-sm"
                    >
                        No monitoring region or national access has been
                        assigned to your account. An administrator can set this
                        in Reviewer access.
                    </div>
                )}
                <form
                    className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        apply(values);
                    }}
                >
                    <Field
                        label={
                            staff
                                ? 'Search institution'
                                : 'Search academic year'
                        }
                        id="search"
                    >
                        <input
                            id="search"
                            className={fieldClass}
                            value={values.search ?? ''}
                            onChange={(e) =>
                                setValues({ ...values, search: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="Academic year" id="year">
                        <input
                            id="year"
                            placeholder="2026-2027"
                            className={fieldClass}
                            value={values.academic_year ?? ''}
                            pattern="[0-9]{4}-[0-9]{4}"
                            onChange={(e) =>
                                setValues({
                                    ...values,
                                    academic_year: e.target.value.replace(
                                        '–',
                                        '-',
                                    ),
                                })
                            }
                        />
                    </Field>
                    <Field label="Semester" id="semester">
                        <select
                            id="semester"
                            className={fieldClass}
                            value={values.semester ?? ''}
                            onChange={(e) =>
                                setValues({
                                    ...values,
                                    semester: e.target.value,
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
                            onChange={(e) =>
                                setValues({ ...values, status: e.target.value })
                            }
                        >
                            <option value="">All statuses</option>
                            {Object.entries(statusLabels).map(
                                ([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    </Field>
                    {staff && (
                        <>
                            {(
                                [
                                    {
                                        key: 'region',
                                        label: 'Region',
                                        options: regions,
                                    },
                                    {
                                        key: 'cluster',
                                        label: 'Cluster',
                                        options: clusters,
                                    },
                                    { key: 'hei', label: 'HEI', options: heis },
                                ] as const
                            ).map(({ key, label, options }) => (
                                <Field key={key} label={label} id={key}>
                                    <select
                                        id={key}
                                        className={fieldClass}
                                        disabled={
                                            key === 'cluster'
                                                ? !values.region
                                                : key === 'hei'
                                                  ? !values.cluster
                                                  : false
                                        }
                                        value={values[key] ?? ''}
                                        onChange={(e) => {
                                            const next = {
                                                ...values,
                                                [key]: e.target.value,
                                                ...(key === 'region'
                                                    ? { cluster: '', hei: '' }
                                                    : key === 'cluster'
                                                      ? { hei: '' }
                                                      : {}),
                                            };
                                            setValues(next);
                                            apply(next);
                                        }}
                                    >
                                        <option value="">
                                            All{' '}
                                            {label === 'HEI'
                                                ? 'HEIs'
                                                : `${label.toLowerCase()}s`}
                                        </option>
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
                        </>
                    )}
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
                <p className="text-sm text-muted-foreground">
                    {reports.meta.total}{' '}
                    {reports.meta.total === 1 ? 'report' : 'reports'}
                </p>
                {reports.data.length ? (
                    <div className="space-y-3">
                        {reports.data.map((report) => (
                            <article
                                key={report.id}
                                className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="mb-2 flex flex-wrap items-center gap-3">
                                        <h2 className="text-lg font-medium">
                                            {report.academic_year} ·{' '}
                                            {report.semester === 1
                                                ? 'First'
                                                : 'Second'}{' '}
                                            Semester
                                        </h2>
                                        <Status status={report.status} />
                                    </div>
                                    <p className="text-sm break-words">
                                        {report.institution_name}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {report.region_name} ·{' '}
                                        {report.cluster_name}
                                    </p>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Updated {localDate(report.updated_at)} ·
                                        Philippine time
                                    </p>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={`/monitoring/${report.id}`}>
                                        {report.can_edit
                                            ? 'Continue report'
                                            : 'View report'}
                                        <ArrowUpRight />
                                    </Link>
                                </Button>
                            </article>
                        ))}
                    </div>
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
                            {reports.meta.total === 0 && canCreate
                                ? 'Start a monitoring report or adjust your filters.'
                                : 'Reports matching your access and filters will appear here.'}
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
