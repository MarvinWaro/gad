import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CircleAlert, History } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import MonitoringReviewController from '@/actions/App/Http/Controllers/Admin/MonitoringReviewController';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import { ReportEditor } from '@/components/monitoring/report-editor';
import {
    ReportSections,
    SectionRail,
} from '@/components/monitoring/report-form';
import { ReportSteps } from '@/components/monitoring/report-steps';
import {
    ReviewHistory,
    ReviewPanel,
} from '@/components/monitoring/review-panel';
import {
    localDate,
    panelClass,
    periodLabel,
    selectClass,
    StagePill,
} from '@/components/monitoring/shared';
import {
    SigningPanel,
    SubmittedPanel,
} from '@/components/monitoring/signing-panel';
import { FormSelect } from '@/components/ui/form-select';
import { useReloadOnBack } from '@/hooks/use-reload-on-back';
import { fieldsOf, stageOf } from '@/lib/monitoring-draft';
import { cn } from '@/lib/utils';
import type {
    MonitoringReport,
    MonitoringRevision,
    MonitoringTemplate,
    RegionOffice,
} from '@/types/monitoring';

type Props = {
    report: MonitoringReport;
    templates: Record<string, MonitoringTemplate>;
    office: RegionOffice | null;
    /** The report's own HEI, or CHED staff. */
    viewer: 'hei' | 'staff';
};

export default function Show(props: Props) {
    // Back and Forward rebuild the page from history; fetch the answers anew.
    useReloadOnBack();
    const current = props.report.revisions?.[0];

    // A new revision (after a return) starts the page afresh.
    return current ? <ReportPage key={current.id} {...props} /> : null;
}

function ReportPage({ report, templates, office, viewer }: Props) {
    const revisions = report.revisions ?? [];
    const current = revisions[0];
    const [selectedId, setSelectedId] = useState(current.id);
    const [choosingFile, setChoosingFile] = useState(false);
    const selected =
        revisions.find((revision) => revision.id === selectedId) ?? current;
    const template = templates[selected.template_version];
    const onCurrent = selected.id === current.id;
    const stage = stageOf(report);
    const returned = revisions
        .flatMap((revision) => revision.reviews)
        .filter((review) => review.decision === 'returned')
        .at(-1);
    const place = report.place.region?.name ?? '';

    return (
        <>
            <Head title={`Monitoring report · ${periodLabel(report)}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Link
                    href={
                        viewer === 'hei'
                            ? MonitoringController.records.url()
                            : MonitoringReviewController.index.url()
                    }
                    className="inline-flex min-h-11 items-center gap-2 self-start text-sm underline-offset-4 hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    {viewer === 'hei' ? 'Records' : 'Monitoring reports'}
                </Link>

                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm break-words text-muted-foreground">
                            {report.place.hei.name}
                            {place && ` · ${place}`}
                        </p>
                        <h1 className="mt-2 text-3xl font-medium tracking-tight">
                            GAD monitoring report
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                            <span>{periodLabel(report)}</span>
                            <span className="text-muted-foreground">
                                Revision {selected.number}
                            </span>
                            {onCurrent && <StagePill stage={stage} />}
                        </div>
                    </div>
                    {revisions.length > 1 && (
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="revision"
                                className="flex items-center gap-1.5 text-sm"
                            >
                                <History aria-hidden className="size-4" />
                                History
                            </label>
                            <FormSelect
                                id="revision"
                                className={cn(selectClass, 'w-auto min-w-64')}
                                value={selected.id}
                                onChange={setSelectedId}
                                placeholder="Choose a revision"
                                options={revisions.map((revision) => ({
                                    value: revision.id,
                                    label: `Revision ${revision.number}${
                                        revision.submitted_at
                                            ? ` · submitted ${localDate(revision.submitted_at)}`
                                            : ' · current'
                                    }`,
                                }))}
                            />
                        </div>
                    )}
                </header>

                {viewer === 'hei' && onCurrent && (
                    <ReportSteps stage={stage} uploading={choosingFile} />
                )}

                {!onCurrent && (
                    <div
                        role="status"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted p-4 text-sm"
                    >
                        <p>
                            You are viewing revision {selected.number}, kept as
                            it was submitted.
                        </p>
                        <button
                            type="button"
                            className="font-medium underline underline-offset-4"
                            onClick={() => setSelectedId(current.id)}
                        >
                            Back to revision {current.number}
                        </button>
                    </div>
                )}

                {onCurrent && report.status === 'returned' && returned && (
                    <section
                        aria-labelledby="returned-heading"
                        className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5"
                    >
                        <h2
                            id="returned-heading"
                            className="flex items-center gap-2 font-medium"
                        >
                            <CircleAlert
                                aria-hidden
                                className="size-4 shrink-0 text-amber-600 dark:text-amber-500"
                            />
                            Returned for correction
                        </h2>
                        {returned.comment && (
                            <p className="mt-3 text-sm break-words whitespace-pre-wrap">
                                {returned.comment}
                            </p>
                        )}
                        <p className="mt-3 text-xs text-muted-foreground">
                            {returned.reviewer} ·{' '}
                            {localDate(returned.created_at)}
                        </p>
                        {viewer === 'hei' && (
                            <p className="mt-3 text-sm">
                                Revision {current.number} starts from your last
                                answers. Correct them, then finalize, sign and
                                submit again. Earlier revisions stay in History.
                            </p>
                        )}
                    </section>
                )}

                {viewer === 'hei' ? (
                    onCurrent && report.abilities.edit ? (
                        <ReportEditor
                            report={report}
                            revision={current}
                            template={template}
                            office={office}
                        />
                    ) : (
                        <ReadOnlyReport
                            report={report}
                            revision={selected}
                            template={template}
                            before={
                                onCurrent && report.abilities.sign ? (
                                    <SigningPanel
                                        report={report}
                                        revision={current}
                                        template={template}
                                        office={office}
                                        onChoose={setChoosingFile}
                                    />
                                ) : selected.submitted_at ? (
                                    <>
                                        <SubmittedPanel
                                            report={report}
                                            revision={selected}
                                            template={template}
                                            office={office}
                                        />
                                        <ReviewHistory revision={selected} />
                                    </>
                                ) : null
                            }
                        />
                    )
                ) : (
                    <StaffReview
                        report={report}
                        revision={selected}
                        template={template}
                        canReview={onCurrent && report.abilities.review}
                    />
                )}
            </div>
        </>
    );
}

/** The answers as they stand, with panels for the next step above them. */
function ReadOnlyReport({
    report,
    revision,
    template,
    before,
}: {
    report: MonitoringReport;
    revision: MonitoringRevision;
    template: MonitoringTemplate;
    before: ReactNode;
}) {
    const fields = fieldsOf(revision);
    const value = (field: string) => fields[field] ?? '';

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <aside className="min-w-0 lg:sticky lg:top-below-header">
                <SectionRail template={template} value={value} />
            </aside>
            <div className="min-w-0 space-y-6">
                {before}
                <ReportSections
                    template={template}
                    place={report.place}
                    value={value}
                    editable={false}
                />
            </div>
        </div>
    );
}

/** CHED's view: the answers on one side, the signed copy and decision on the other. */
function StaffReview({
    report,
    revision,
    template,
    canReview,
}: {
    report: MonitoringReport;
    revision: MonitoringRevision;
    template: MonitoringTemplate;
    canReview: boolean;
}) {
    const fields = fieldsOf(revision);

    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <div className="min-w-0 space-y-6 lg:sticky lg:top-below-header lg:order-2">
                {revision.submitted_at ? (
                    <ReviewPanel
                        report={report}
                        revision={revision}
                        canReview={canReview}
                    />
                ) : (
                    <div className={`${panelClass} text-sm`}>
                        <p className="font-medium">Not submitted yet</p>
                        <p className="mt-1 text-muted-foreground">
                            The HEI is still working on this revision. Last
                            saved {localDate(report.updated_at)}.
                        </p>
                    </div>
                )}
                <ReviewHistory revision={revision} />
            </div>
            <div className="min-w-0 lg:order-1">
                <ReportSections
                    template={template}
                    place={report.place}
                    value={(field) => fields[field] ?? ''}
                    editable={false}
                />
            </div>
        </div>
    );
}
