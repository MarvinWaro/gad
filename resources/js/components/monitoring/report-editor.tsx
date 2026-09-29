import { router } from '@inertiajs/react';
import { CircleAlert, CloudOff, LockKeyhole, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useMonitoringAutosave } from '@/hooks/use-monitoring-autosave';
import type { SaveStatus } from '@/hooks/use-monitoring-autosave';
import {
    answerField,
    blankAnswers,
    DETAIL_KEYS,
    detailField,
    isBlank,
} from '@/lib/monitoring-draft';
import { toast } from '@/lib/toast';
import type {
    MonitoringDetails,
    MonitoringReport,
    MonitoringRevision,
    MonitoringTemplate,
    RegionOffice,
} from '@/types/monitoring';
import { PdfButton, pdfInput } from './pdf-button';
import { fieldId, ReportSections, SectionRail } from './report-form';
import { localDate } from './shared';

/** Step one: the form, saved as the HEI types, then finalized for signing. */
export function ReportEditor({
    report,
    revision,
    template,
    office,
}: {
    report: MonitoringReport;
    revision: MonitoringRevision;
    template: MonitoringTemplate;
    office: RegionOffice | null;
}) {
    const autosave = useMonitoringAutosave(report, revision, true);
    const [checking, setChecking] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [finalizing, setFinalizing] = useState(false);
    const blanks = blankAnswers(template, autosave.value);
    const blankDetails = [
        { field: detailField('address'), label: template.labels.address },
        {
            field: detailField('accomplished_on'),
            label: template.labels.accomplished_on,
        },
        ...template.signatories.map((signatory) => ({
            field: detailField(signatory.key),
            label: `${signatory.role}’s name`,
        })),
    ].filter((detail) => isBlank(autosave.value(detail.field)));

    /** The report as last saved, for the draft preview. */
    function savedValues(): {
        details: MonitoringDetails;
        answers: Record<string, string>;
    } {
        const details = Object.fromEntries(
            DETAIL_KEYS.map((key) => [key, autosave.value(detailField(key))]),
        ) as MonitoringDetails;
        const answers = Object.fromEntries(
            template.sections
                .flatMap((section) => section.items)
                .map((item) => [
                    item.key,
                    autosave.value(answerField(item.key)),
                ]),
        );

        return { details, answers };
    }

    /** Save what is waiting; say so when it cannot be saved yet. */
    async function saveAll(): Promise<boolean> {
        const saved = await autosave.flush();

        if (!saved) {
            toast.error('Some changes are not saved yet.', {
                description:
                    'Settle the highlighted answers or check your connection, then try again.',
            });
        }

        return saved;
    }

    async function reviewBeforeFinalizing() {
        setChecking(true);
        const saved = await saveAll();
        setChecking(false);
        setConfirming(saved);
    }

    function finalize() {
        router.post(
            MonitoringController.finalize.url(report.id),
            { lock_version: autosave.lockVersion },
            {
                onStart: () => setFinalizing(true),
                onFinish: () => {
                    setFinalizing(false);
                    setConfirming(false);
                },
                onError: (errors) =>
                    toast.error(
                        errors.report ??
                            errors.lock_version ??
                            'The report could not be finalized.',
                    ),
            },
        );
    }

    function jumpTo(field: string) {
        setConfirming(false);
        // Wait for the dialog to close and give focus back first.
        window.setTimeout(() => {
            const element = document.getElementById(fieldId(field));
            element?.scrollIntoView({ block: 'center' });
            element?.focus({ preventScroll: true });
        }, 50);
    }

    return (
        <>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                <aside className="min-w-0 lg:sticky lg:top-below-header">
                    <SectionRail template={template} value={autosave.value} />
                </aside>
                <div className="min-w-0 space-y-6">
                    <ReportSections
                        template={template}
                        place={report.place}
                        value={autosave.value}
                        editable
                        onChange={autosave.setField}
                        onBlur={() => void autosave.save()}
                        conflict={autosave.conflict}
                        onResolve={autosave.resolve}
                    />
                    <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border bg-card/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-4">
                        <SaveState
                            status={autosave.status}
                            message={autosave.message}
                            savedAt={autosave.savedAt}
                            onRetry={() => void autosave.save()}
                        />
                        <div className="flex flex-wrap gap-2">
                            <PdfButton
                                variant="outline"
                                before={saveAll}
                                input={() =>
                                    pdfInput(
                                        report,
                                        { ...revision, document_code: null },
                                        template,
                                        office,
                                        savedValues(),
                                    )
                                }
                            >
                                Preview PDF
                            </PdfButton>
                            <Button
                                type="button"
                                onClick={() => void reviewBeforeFinalizing()}
                                disabled={
                                    checking ||
                                    autosave.status === 'locked' ||
                                    autosave.status === 'expired'
                                }
                            >
                                {checking && <Spinner />}
                                Finalize for signing
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={confirming} onOpenChange={setConfirming}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Finalize for signing?</DialogTitle>
                        <DialogDescription>
                            The answers lock and the report gets a document
                            code, printed on every page. You can unlock it to
                            make changes until you submit, but copies printed
                            before then will no longer match.
                        </DialogDescription>
                    </DialogHeader>
                    {(blanks.length > 0 || blankDetails.length > 0) && (
                        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
                            <p className="flex items-center gap-2 font-medium">
                                <CircleAlert
                                    aria-hidden
                                    className="size-4 shrink-0 text-amber-600 dark:text-amber-500"
                                />
                                {blanks.length > 0
                                    ? `${blanks.length} of ${template.sections.flatMap((section) => section.items).length} requirements are blank`
                                    : 'Some details are blank'}
                            </p>
                            {blanks.length > 0 && (
                                <p className="mt-1 text-muted-foreground">
                                    CHED asks for the actual situation per item.
                                    If an item does not apply, you can say why.
                                </p>
                            )}
                            <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
                                {[...blankDetails, ...blanks].map((blank) => (
                                    <li key={blank.field}>
                                        <button
                                            type="button"
                                            className="text-left underline underline-offset-4 hover:text-foreground"
                                            onClick={() => jumpTo(blank.field)}
                                        >
                                            {blank.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirming(false)}
                        >
                            Keep editing
                        </Button>
                        <Button
                            type="button"
                            onClick={finalize}
                            disabled={finalizing}
                        >
                            {finalizing && <Spinner />}
                            Finalize for signing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={autosave.leaving !== null}
                onOpenChange={(open) => {
                    if (!open) autosave.stay();
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave without saving?</DialogTitle>
                        <DialogDescription>
                            Your latest changes have not saved yet. Stay to let
                            them save, or leave and lose them.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={autosave.leave}
                        >
                            Leave without saving
                        </Button>
                        <Button type="button" onClick={autosave.stay}>
                            Stay on this page
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SaveState({
    status,
    message,
    savedAt,
    onRetry,
}: {
    status: SaveStatus;
    message: string | null;
    savedAt: string;
    onRetry: () => void;
}) {
    const text: Record<SaveStatus, string> = {
        saved: `All changes saved · ${localDate(savedAt)}`,
        pending: 'Unsaved changes',
        saving: 'Saving…',
        conflict:
            'A colleague changed some answers. Choose which version to keep.',
        offline:
            'You appear to be offline. Your changes will save when you reconnect.',
        error: 'Your changes could not save. Trying again…',
        invalid: message ?? 'Some answers could not save.',
        expired:
            'Your session ended. Sign in again in another tab, then retry. Your text is still here.',
        locked:
            message ??
            'This report changed in another session. Copy anything you still need, then reload.',
    };
    const warning = !['saved', 'pending', 'saving'].includes(status);

    return (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
            {status === 'offline' ? (
                <CloudOff
                    aria-hidden
                    className="size-4 shrink-0 text-amber-600 dark:text-amber-500"
                />
            ) : status === 'locked' ? (
                <LockKeyhole
                    aria-hidden
                    className="size-4 shrink-0 text-amber-600 dark:text-amber-500"
                />
            ) : (
                warning && (
                    <CircleAlert
                        aria-hidden
                        className="size-4 shrink-0 text-amber-600 dark:text-amber-500"
                    />
                )
            )}
            <p
                role="status"
                aria-live="polite"
                className={
                    warning ? 'text-sm' : 'text-sm text-muted-foreground'
                }
            >
                {text[status]}
            </p>
            {status === 'locked' ? (
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Reload
                </Button>
            ) : (
                ['error', 'expired', 'invalid', 'offline'].includes(status) && (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={onRetry}
                    >
                        <RotateCcw />
                        Try again
                    </Button>
                )
            )}
        </div>
    );
}
