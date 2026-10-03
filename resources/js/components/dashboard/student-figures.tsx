import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { SegmentedSwitch } from '@/components/dashboard/segmented-switch';
import { SexLegend, SexSplitBar } from '@/components/sex-split-bar';
import { FiguresTable } from '@/components/student-counts/figures-table';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { changeLabel, formatCount, percentOf } from '@/lib/dashboard';
import type {
    DashboardStudents,
    StudentCountKind,
    StudentYearFigures,
} from '@/types/statistics';

/** Discipline groups listed before "Show all". */
const GROUP_ROWS = 8;

const kinds: { value: StudentCountKind; label: string; noun: string }[] = [
    { value: 'enrollment', label: 'Enrollment', noun: 'students' },
    { value: 'graduates', label: 'Graduates', noun: 'graduates' },
];

/**
 * "Who studies, who graduates.": enrollment and graduates by sex, from the
 * figures regional offices import (Settings → Statistics). Each shows the
 * newest year up to the one in view; they are regional totals, so an HEI or
 * ownership filter sets them aside.
 */
export function StudentFigures({
    students,
    footer,
}: {
    students: DashboardStudents;
    footer?: ReactNode;
}) {
    const first = students.enrollment ? 'enrollment' : 'graduates';
    const [kind, setKind] = useState<StudentCountKind>(first);
    const [table, setTable] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const figures = students[kind];
    const { label, noun } = kinds.find((option) => option.value === kind)!;
    const hasFigures =
        students.enrollment !== null || students.graduates !== null;
    const groups = [...(figures?.groups ?? [])].sort(
        (a, b) => b.female + b.male - (a.female + a.male),
    );
    const shown = expanded ? groups : groups.slice(0, GROUP_ROWS);

    return (
        <section
            aria-labelledby="students-title"
            className="flex min-w-0 flex-col rounded-xl border bg-card p-5 sm:p-6 md:col-span-2 xl:col-span-12"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="students-title" className="text-lg font-medium">
                        Who studies, who graduates.
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Enrollment and graduates by sex and discipline group
                    </p>
                </div>
                <GraduationCap
                    aria-hidden="true"
                    className="size-5 text-brand"
                />
            </div>

            {students.heisOnly || !hasFigures ? (
                <p className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    {students.heisOnly
                        ? 'Enrollment and graduate figures are regional totals, so they don’t narrow to one HEI or ownership. Clear those filters to see them.'
                        : 'No enrollment or graduate figures yet. They appear here once a regional office imports them in Settings → Enrollment & graduates.'}
                </p>
            ) : (
                <div className="mt-6 grid gap-6 xl:grid-cols-12">
                    <dl className="grid content-start gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
                        {kinds.map((option) => (
                            <YearSummary
                                key={option.value}
                                label={option.label}
                                figures={students[option.value]}
                            />
                        ))}
                    </dl>

                    <div className="min-w-0 xl:col-span-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <SegmentedSwitch
                                label="Figures"
                                value={kind}
                                onChange={(value) => {
                                    setKind(value);
                                    setExpanded(false);
                                }}
                                options={kinds}
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTable(!table)}
                                aria-pressed={table}
                                aria-label={`Show ${label.toLowerCase()} data table`}
                                disabled={figures === null}
                            >
                                {table ? 'Show chart' : 'View data'}
                            </Button>
                        </div>

                        {figures === null ? (
                            <p className="mt-5 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                                No {label.toLowerCase()} figures yet for this
                                year or before.
                            </p>
                        ) : table ? (
                            <div className="mt-5 overflow-hidden rounded-lg border">
                                <FiguresTable
                                    groups={figures.groups}
                                    caption={`${label} by discipline group and sex, academic year ${figures.academic_year}`}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-sm font-medium">
                                        {label} by discipline group, AY{' '}
                                        {figures.academic_year}
                                    </h3>
                                    <SexLegend />
                                </div>
                                <ul className="mt-4 space-y-3.5">
                                    {shown.map((group) => {
                                        const total = group.female + group.male;
                                        const female = percentOf(
                                            group.female,
                                            total,
                                        );

                                        return (
                                            <li key={group.id}>
                                                <div className="flex justify-between gap-3 text-sm">
                                                    <span className="truncate">
                                                        {group.name}
                                                    </span>
                                                    <span className="font-medium tabular-nums">
                                                        {formatCount(total)}
                                                    </span>
                                                </div>
                                                <p className="sr-only">
                                                    {female}% female,{' '}
                                                    {100 - female}% male
                                                </p>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            aria-hidden="true"
                                                            className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground tabular-nums"
                                                        >
                                                            <span className="w-9 text-right">
                                                                {female}%
                                                            </span>
                                                            <SexSplitBar
                                                                female={
                                                                    group.female
                                                                }
                                                                male={
                                                                    group.male
                                                                }
                                                                parity
                                                                className="h-2.5 flex-1"
                                                            />
                                                            <span className="w-9">
                                                                {100 - female}%
                                                            </span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {group.name}: female{' '}
                                                        {formatCount(
                                                            group.female,
                                                        )}
                                                        , male{' '}
                                                        {formatCount(
                                                            group.male,
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {groups.length > GROUP_ROWS && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-3"
                                        aria-expanded={expanded}
                                        onClick={() => setExpanded(!expanded)}
                                    >
                                        {expanded
                                            ? 'Show fewer groups'
                                            : `Show all ${groups.length} groups`}
                                    </Button>
                                )}
                                <p className="mt-3 text-xs text-muted-foreground">
                                    The line marks an even split. Hover a bar
                                    for its {noun}, or use View data.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {(figures || footer) && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
                    {figures && (
                        <p className="text-xs text-muted-foreground">
                            Regional totals from {regionList(figures.regions)}.
                        </p>
                    )}
                    {footer}
                </div>
            )}
        </section>
    );
}

/** One kind's year in brief: the total, the female share and the change. */
function YearSummary({
    label,
    figures,
}: {
    label: string;
    figures: StudentYearFigures | null;
}) {
    if (figures === null) {
        return (
            <div className="rounded-lg border p-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="mt-3 text-sm text-muted-foreground">
                    No figures yet for this year or before.
                </dd>
            </div>
        );
    }

    const total = figures.female + figures.male;
    const previous = figures.previous;

    return (
        <div className="rounded-lg border p-4">
            <dt className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                {label}
                <span className="text-xs">AY {figures.academic_year}</span>
            </dt>
            <dd className="mt-3 text-4xl leading-none font-medium tracking-tight tabular-nums">
                {formatCount(total)}
            </dd>
            <dd className="mt-3 text-xs font-medium text-brand">
                {percentOf(figures.female, total)}% female
            </dd>
            <dd className="mt-3">
                <SexSplitBar
                    female={figures.female}
                    male={figures.male}
                    className="h-2.5"
                />
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground tabular-nums">
                    <span className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="size-2.5 rounded-full bg-series-1"
                        />
                        Female {formatCount(figures.female)}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="size-2.5 rounded-full bg-series-2"
                        />
                        Male {formatCount(figures.male)}
                    </span>
                </p>
            </dd>
            <dd className="mt-2 text-xs text-muted-foreground">
                {[
                    figures.latest && 'The latest year imported',
                    previous &&
                        changeLabel(
                            {
                                value: total,
                                previous: previous.female + previous.male,
                            },
                            `vs. AY ${previous.academic_year}`,
                        ),
                ]
                    .filter(Boolean)
                    .join(' · ') || 'No earlier year to compare'}
            </dd>
        </div>
    );
}

/** "Regional Office XII", "A and B", or "A, B and 3 more regions". */
function regionList(regions: string[]): string {
    if (regions.length <= 2) {
        return regions.join(' and ');
    }

    return regions.length === 3
        ? `${regions[0]}, ${regions[1]} and ${regions[2]}`
        : `${regions[0]}, ${regions[1]} and ${regions.length - 2} more regions`;
}
