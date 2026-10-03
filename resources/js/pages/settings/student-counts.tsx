import { Head, Link, router } from '@inertiajs/react';
import { Download, FileSpreadsheet, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { selectClass } from '@/components/monitoring/shared';
import { Filter, FilterBar, NoOfficeNotice } from '@/components/record-filters';
import { SexLegend } from '@/components/sex-split-bar';
import { StatTile } from '@/components/stat-tile';
import { FiguresTable } from '@/components/student-counts/figures-table';
import { ImportDialog } from '@/components/student-counts/import-dialog';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { formatCount, percentOf } from '@/lib/dashboard';
import { localDate } from '@/lib/manila-time';
import { cn } from '@/lib/utils';
import { destroy, index, template } from '@/routes/settings/student-counts';
import type { DirectoryOption } from '@/types/monitoring';
import type { DisciplineFigures, StudentCountKind } from '@/types/statistics';

type Props = {
    kind: StudentCountKind;
    kinds: { value: StudentCountKind; label: string }[];
    academic_year: string;
    figures: {
        male: number;
        female: number;
        imported_at: string | null;
        groups: DisciplineFigures[];
        regions: string[];
    } | null;
    /** The years with figures for this kind and place, newest first. */
    years: { label: string; groups: number }[];
    academicYears: string[];
    /** The Central Office's chosen region; empty for every region. */
    region: string;
    regions: DirectoryOption[];
    hasOffice: boolean;
    nationalAccess: boolean;
    permissions: { import: boolean; delete: boolean };
};

const nouns: Record<StudentCountKind, string> = {
    enrollment: 'students enrolled',
    graduates: 'graduates',
};

/**
 * Settings → Statistics → Enrollment & graduates: each region's women and men
 * by discipline group, imported from its statistics files. The figures feed
 * the dashboard and the homepage (docs/enrollment-and-graduates.md).
 */
export default function StudentCounts({
    kind,
    kinds,
    academic_year: academicYear,
    figures,
    years,
    academicYears,
    region,
    regions,
    hasOffice,
    nationalAccess,
    permissions,
}: Props) {
    const [loading, setLoading] = useState(false);
    const kindLabel = kinds.find((option) => option.value === kind)?.label;
    const filters = { kind, academic_year: academicYear, region };
    // One region in view: a regional office's own, or the one chosen.
    const oneRegion = !nationalAccess || region !== '';
    const groupsByYear = new Map(
        years.map((year) => [year.label, year.groups]),
    );

    function show(next: Partial<typeof filters>) {
        router.get(
            index.url(),
            Object.fromEntries(
                Object.entries({ ...filters, ...next }).filter(
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

    return (
        <>
            <Head title="Enrollment and graduates" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl min-w-0">
                        <Heading
                            variant="small"
                            title="Enrollment and graduates"
                            description="Women and men enrolled and graduating, by discipline group, from each regional office's statistics. The dashboard and the homepage show them."
                        />
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <a href={template.url()}>
                                <Download />
                                Template
                            </a>
                        </Button>
                        {permissions.import && (
                            <ImportDialog
                                kind={kind}
                                kinds={kinds}
                                region={region}
                                regions={regions}
                                nationalAccess={nationalAccess}
                            />
                        )}
                    </div>
                </div>

                {!hasOffice && <NoOfficeNotice noun="figures" />}

                <nav aria-label="Figures" className="flex gap-1 border-b">
                    {kinds.map((option) => (
                        <Link
                            key={option.value}
                            href={index.url({
                                query: {
                                    kind: option.value,
                                    ...(region ? { region } : {}),
                                },
                            })}
                            preserveScroll
                            aria-current={
                                option.value === kind ? 'page' : undefined
                            }
                            className={cn(
                                '-mb-px flex h-11 items-center border-b-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                option.value === kind
                                    ? 'border-foreground font-medium text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {option.label}
                        </Link>
                    ))}
                </nav>

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter figures"
                        filters={regions.length > 1 ? 2 : 1}
                        className="border-b-0 @3xl:grid-cols-3"
                    >
                        <Filter label="Academic year" id="academic_year">
                            <FormSelect
                                id="academic_year"
                                className={selectClass}
                                value={academicYear}
                                onChange={(value) =>
                                    show({ academic_year: value })
                                }
                                placeholder="Choose a year"
                                options={academicYears.map((year) => ({
                                    value: year,
                                    label: groupsByYear.has(year)
                                        ? `${year} · ${groupsByYear.get(year)} groups`
                                        : year,
                                }))}
                            />
                        </Filter>
                        {regions.length > 1 && (
                            <Filter label="Region" id="region">
                                <FormSelect
                                    id="region"
                                    className={selectClass}
                                    value={region}
                                    onChange={(value) =>
                                        show({
                                            region: value,
                                            academic_year: '',
                                        })
                                    }
                                    placeholder="All regions"
                                    allowEmpty
                                    emptyLabel="All regions"
                                    options={regions.map((option) => ({
                                        value: String(option.id),
                                        label: option.name,
                                    }))}
                                />
                            </Filter>
                        )}
                    </FilterBar>
                </div>

                <div
                    aria-busy={loading}
                    className={cn(
                        'space-y-6 transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    {figures ? (
                        <>
                            <dl className="grid gap-3 sm:grid-cols-3">
                                <StatTile
                                    label={`Total, AY ${academicYear}`}
                                    value={formatCount(
                                        figures.female + figures.male,
                                    )}
                                    note={`${kindLabel} across ${figures.groups.length} discipline groups`}
                                />
                                <StatTile
                                    label="Female"
                                    value={formatCount(figures.female)}
                                    note={`${percentOf(figures.female, figures.female + figures.male)}% of ${nouns[kind]}`}
                                />
                                <StatTile
                                    label="Male"
                                    value={formatCount(figures.male)}
                                    note={`${percentOf(figures.male, figures.female + figures.male)}% of ${nouns[kind]}`}
                                />
                            </dl>

                            <section
                                aria-labelledby="figures-title"
                                className="overflow-hidden rounded-xl border bg-card"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                                    <h2
                                        id="figures-title"
                                        className="text-sm font-medium"
                                    >
                                        {kindLabel} by discipline group, AY{' '}
                                        {academicYear}
                                    </h2>
                                    <SexLegend />
                                </div>
                                <FiguresTable
                                    groups={figures.groups}
                                    caption={`${kindLabel} by discipline group and sex, academic year ${academicYear}, ${figures.regions.join(', ')}`}
                                />
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground">
                                    {figures.imported_at &&
                                        `Imported ${localDate(figures.imported_at)} · `}
                                    {figures.regions.join(', ')}
                                </p>
                                {permissions.delete && oneRegion && (
                                    <ConfirmPopover
                                        title={`Delete the AY ${academicYear} ${kindLabel?.toLowerCase()} figures?`}
                                        description={`${figures.regions.join(', ')}'s figures for this year leave the dashboard and the homepage. You can import the file again.`}
                                        confirmLabel="Delete"
                                        onConfirm={(visit) =>
                                            router.delete(destroy.url(), {
                                                data: {
                                                    kind,
                                                    academic_year: academicYear,
                                                    ...(region
                                                        ? { region }
                                                        : {}),
                                                },
                                                preserveScroll: true,
                                                ...visit,
                                            })
                                        }
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 />
                                            Delete these figures
                                        </Button>
                                    </ConfirmPopover>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border bg-card px-6 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <FileSpreadsheet
                                    aria-hidden
                                    className="size-5 text-muted-foreground"
                                />
                            </span>
                            <h2 className="mt-4 font-medium">
                                No {kindLabel?.toLowerCase()} figures for AY{' '}
                                {academicYear}
                            </h2>
                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                {permissions.import
                                    ? 'Import the regional office’s file to add them. Each year in the file is added, or replaces what the region had for it.'
                                    : 'They appear here once a regional office imports them.'}
                            </p>
                            {years.length > 0 && (
                                <p className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm">
                                    <span className="text-muted-foreground">
                                        Years with figures:
                                    </span>
                                    {years.map((year) => (
                                        <button
                                            key={year.label}
                                            type="button"
                                            className="tap-target font-medium underline underline-offset-4"
                                            onClick={() =>
                                                show({
                                                    academic_year: year.label,
                                                })
                                            }
                                        >
                                            AY {year.label}
                                        </button>
                                    ))}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
