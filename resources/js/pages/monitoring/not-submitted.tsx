import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, CircleCheck } from 'lucide-react';
import ChecklistResponseController from '@/actions/App/Http/Controllers/Admin/ChecklistResponseController';
import MonitoringReviewController from '@/actions/App/Http/Controllers/Admin/MonitoringReviewController';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import { ReviewViews } from '@/components/monitoring/review-views';
import {
    selectClass,
    semesterLabel,
    semesterOptions,
} from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import {
    Filter,
    FilterBar,
    NoOfficeNotice,
    OfficeScope,
    PlaceFilters,
    placeFilterCount,
    SearchFilter,
    useRecordFilters,
    YearFilter,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { useLiveModules, useLiveReload } from '@/hooks/use-live';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { ActivityTone } from '@/types/activity';
import type {
    ChecklistType,
    DirectoryOption,
    ReportFilters,
    SubmissionGap,
    SubmissionGapPage,
} from '@/types/monitoring';

type Subject =
    | { kind: 'report'; title: string; noun: string }
    | { kind: 'checklist'; type: ChecklistType; title: string; noun: string };

type Props = {
    subject: Subject;
    gaps: SubmissionGapPage;
    filters: ReportFilters;
    /** The period listed: the one chosen, or the current one. */
    period: { academic_year: string; semester: 1 | 2 | null };
    academicYears: string[];
    hasOffice: boolean;
    regions: DirectoryOption[];
    heis: DirectoryOption[];
};

const statuses: Record<
    SubmissionGap['status'],
    { label: string; tone: ActivityTone }
> = {
    not_started: { label: 'Not started', tone: 'neutral' },
    draft: { label: 'Draft', tone: 'info' },
    returned: { label: 'Returned for correction', tone: 'warning' },
};

/**
 * The institutions in the office's reach that have not sent what a period
 * asks: a semester's monitoring report (not started, still a draft, or
 * returned), or a year's GAD survey. The "Not yet submitted" view beside
 * each "Received" list.
 */
export default function NotSubmitted({
    subject,
    gaps,
    filters,
    period,
    academicYears,
    hasOffice,
    regions,
    heis,
}: Props) {
    const report = subject.kind === 'report';
    useLiveReload(useLiveModules(report ? 'monitoring' : 'gad-surveys'), [
        'gaps',
    ]);

    const urls = report
        ? {
              received: MonitoringReviewController.index.url(),
              notSubmitted: MonitoringReviewController.notSubmitted.url(),
          }
        : {
              received: ChecklistResponseController.index.url(subject.type),
              notSubmitted: ChecklistResponseController.notSubmitted.url(
                  subject.type,
              ),
          };
    const { values, loading, apply, change, search, pick } = useRecordFilters(
        urls.notSubmitted,
        filters,
    );
    const total = gaps.meta.total;
    const periodText =
        report && period.semester
            ? `${period.academic_year} ${semesterLabel(period.semester)}`
            : `AY ${period.academic_year}`;
    const summary =
        total === 0
            ? `Every institution has sent the ${periodText} ${subject.noun}.`
            : `${total.toLocaleString('en-PH')} ${total === 1 ? 'institution has' : 'institutions have'} not sent the ${periodText} ${subject.noun} yet.`;

    return (
        <>
            <Head title={`${subject.title}: not yet submitted`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <p className="mb-2 text-sm text-muted-foreground">
                        Institutional reporting · CHED review
                    </p>
                    <h1 className="text-3xl font-medium tracking-tight">
                        {subject.title}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {report
                            ? 'Institutions that have not sent the report: not started, still a draft, or returned for correction.'
                            : 'Institutions that have not answered the survey for the year.'}
                    </p>
                </header>

                {!hasOffice && <NoOfficeNotice noun="institutions" />}
                <OfficeScope noun="Institutions" />
                <ReviewViews {...urls} current="not-submitted" />

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter institutions"
                        filters={(report ? 2 : 1) + placeFilterCount(regions)}
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Institution name"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                        <YearFilter
                            required
                            value={values.academic_year || period.academic_year}
                            years={academicYears}
                            onChange={(value) =>
                                change({ ...values, academic_year: value })
                            }
                        />
                        {report && (
                            <Filter label="Semester" id="semester">
                                <FormSelect
                                    id="semester"
                                    className={selectClass}
                                    value={
                                        values.semester ||
                                        String(period.semester)
                                    }
                                    onChange={(value) =>
                                        change({ ...values, semester: value })
                                    }
                                    placeholder="Semester"
                                    options={semesterOptions}
                                />
                            </Filter>
                        )}
                        <PlaceFilters
                            values={values}
                            onPick={pick}
                            regions={regions}
                            heis={heis}
                        />
                    </FilterBar>

                    <p
                        role="status"
                        className="border-b px-4 py-3 text-sm sm:px-5"
                    >
                        {summary}
                    </p>

                    {gaps.data.length ? (
                        <ul
                            aria-busy={loading}
                            className={cn(
                                'divide-y transition-opacity',
                                loading && 'opacity-60',
                            )}
                        >
                            {gaps.data.map((gap) => (
                                <GapRow key={gap.hei.id} gap={gap} />
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center px-6 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                                <CircleCheck aria-hidden className="size-5" />
                            </span>
                            <p className="mt-4 font-medium">All caught up</p>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                {values.search
                                    ? 'No institution by that name is missing it.'
                                    : 'Every institution here has sent it.'}
                            </p>
                        </div>
                    )}

                    {total > 0 && (
                        <Pagination
                            page={gaps.meta}
                            label={total === 1 ? 'institution' : 'institutions'}
                            persistent
                            className="sm:px-5"
                        />
                    )}
                </div>
            </div>
        </>
    );
}

/** One institution: where it is, how far it got, and a way to its draft. */
function GapRow({ gap }: { gap: SubmissionGap }) {
    const status = statuses[gap.status];

    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-5">
            <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{gap.hei.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                    {gap.region}
                    {!gap.has_focal && ' · No GAD Focal account yet'}
                </p>
            </div>
            <span
                className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    tones[status.tone].badge,
                )}
            >
                {status.label}
            </span>
            {gap.report_id && (
                <Button variant="outline" size="sm" asChild>
                    <Link href={MonitoringController.show.url(gap.report_id)}>
                        View
                        <span className="sr-only">
                            {' '}
                            the {gap.hei.name} {status.label.toLowerCase()}
                        </span>
                        <ArrowUpRight />
                    </Link>
                </Button>
            )}
        </li>
    );
}
