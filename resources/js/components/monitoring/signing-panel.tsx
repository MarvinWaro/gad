import { router, useForm } from '@inertiajs/react';
import {
    ExternalLink,
    FileText,
    PencilLine,
    Send,
    Upload,
    X,
} from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { formatFileSize } from '@/lib/file-size';
import { toast } from '@/lib/toast';
import type {
    MonitoringReport,
    MonitoringRevision,
    MonitoringTemplate,
    RegionOffice,
} from '@/types/monitoring';
import { PdfButton, pdfInput } from './pdf-button';
import { localDate, panelClass } from './shared';

const MAX_BYTES = 20 * 1024 * 1024;

type PanelProps = {
    report: MonitoringReport;
    revision: MonitoringRevision;
    template: MonitoringTemplate;
    office: RegionOffice | null;
};

/** The document code, set large so it is easy to compare with the paper. */
export function DocumentCode({
    code,
    className,
}: {
    code: string;
    className?: string;
}) {
    return (
        <div className={className}>
            <p className="text-xs font-medium text-muted-foreground">
                Document code
            </p>
            <p className="mt-1 font-mono text-2xl font-medium tracking-wider tabular-nums">
                {code}
            </p>
        </div>
    );
}

/** Steps two and three: print the finalized report, sign it, send the scan. */
export function SigningPanel({
    report,
    revision,
    template,
    office,
    onChoose,
}: PanelProps & { onChoose: (chosen: boolean) => void }) {
    const code = revision.document_code ?? '';
    const inputId = useId();
    const input = useRef<HTMLInputElement>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const form = useForm<{
        lock_version: number;
        confirmed: boolean;
        file: File | null;
    }>({ lock_version: report.lock_version, confirmed: false, file: null });
    const serverError =
        form.errors.file ??
        form.errors.confirmed ??
        (form.errors as Partial<Record<string, string>>).report ??
        form.errors.lock_version;

    function choose(file: File | undefined) {
        setFileError(null);

        if (!file) {
            return;
        }

        if (
            file.type !== 'application/pdf' &&
            !file.name.toLowerCase().endsWith('.pdf')
        ) {
            setFileError('Choose a PDF file.');
        } else if (file.size > MAX_BYTES) {
            setFileError('The signed PDF must be 20 MB or smaller.');
        } else {
            form.setData('file', file);
            onChoose(true);
        }
    }

    function clearFile() {
        form.setData('file', null);
        onChoose(false);

        if (input.current) {
            input.current.value = '';
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(MonitoringController.submit.url(report.id), {
            forceFormData: true,
        });
    }

    function reopen(visit: ConfirmVisit) {
        router.post(
            MonitoringController.reopen.url(report.id),
            { lock_version: report.lock_version },
            {
                ...visit,
                onError: (errors) =>
                    toast.error(
                        errors.report ??
                            errors.lock_version ??
                            'The report could not be unlocked.',
                    ),
            },
        );
    }

    return (
        <div className="space-y-6">
            <section
                aria-labelledby="print-heading"
                className={`${panelClass} space-y-5`}
            >
                <div>
                    <h2 id="print-heading" className="text-xl font-medium">
                        Print and sign
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        The answers are locked. Download the report in the
                        official form&rsquo;s layout, then:
                    </p>
                    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
                        <li>
                            Print it at actual size on 8.5 × 13 in (long bond)
                            paper.
                        </li>
                        <li>
                            Have the President and the GAD Focal Person sign
                            over their names.
                        </li>
                        <li>Scan every page into one PDF.</li>
                    </ol>
                </div>
                <div className="flex flex-col gap-4 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                    <DocumentCode code={code} />
                    <p className="max-w-xs text-sm text-muted-foreground">
                        Printed at the foot of every page. CHED checks the
                        signed copy against it.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <PdfButton
                        variant="outline"
                        input={() =>
                            pdfInput(report, revision, template, office)
                        }
                    >
                        Download PDF for signing
                    </PdfButton>
                    <ConfirmPopover
                        title="Edit the answers again?"
                        description="The report unlocks and its document code is cleared. Copies you have printed will no longer match: finalize and print again when you are done."
                        confirmLabel="Edit answers"
                        onConfirm={reopen}
                    >
                        <Button type="button" variant="ghost">
                            <PencilLine />
                            Edit answers
                        </Button>
                    </ConfirmPopover>
                </div>
            </section>

            <form
                onSubmit={submit}
                aria-labelledby="upload-heading"
                className={`${panelClass} space-y-5`}
            >
                <div>
                    <h2 id="upload-heading" className="text-xl font-medium">
                        Upload the signed copy
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        One PDF, up to 20 MB. Submitting sends it with the
                        answers to CHED for review.
                    </p>
                </div>
                <input
                    ref={input}
                    id={inputId}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={(event) => choose(event.target.files?.[0])}
                />
                {form.data.file ? (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                        <FileText
                            aria-hidden
                            className="size-5 shrink-0 text-muted-foreground"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {form.data.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatFileSize(form.data.file.size)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearFile}
                            disabled={form.processing}
                        >
                            <X />
                            <span className="sr-only">
                                Remove {form.data.file.name}
                            </span>
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => input.current?.click()}
                    >
                        <Upload />
                        Choose signed PDF
                    </Button>
                )}
                {(fileError ?? serverError) && (
                    <p role="alert" className="text-sm text-destructive">
                        {fileError ?? serverError}
                    </p>
                )}
                <label className="flex items-start gap-3 text-sm leading-relaxed">
                    <Checkbox
                        className="mt-0.5"
                        checked={form.data.confirmed}
                        onCheckedChange={(checked) =>
                            form.setData('confirmed', checked === true)
                        }
                    />
                    <span>
                        This PDF is signed by the President and the GAD Focal
                        Person, and its pages show document code{' '}
                        <span className="font-mono font-medium">{code}</span>.
                    </span>
                </label>
                {form.progress && (
                    <p role="status" className="text-sm text-muted-foreground">
                        Uploading {form.progress.percentage}%
                    </p>
                )}
                <Button
                    type="submit"
                    disabled={
                        !form.data.file ||
                        !form.data.confirmed ||
                        form.processing
                    }
                >
                    {form.processing ? <Spinner /> : <Send />}
                    Submit to CHED
                </Button>
            </form>
        </div>
    );
}

/** A submitted revision: when it went in, and its signed copy. */
export function SubmittedPanel({
    report,
    revision,
    template,
    office,
}: PanelProps) {
    const reviewed = revision.reviews.at(-1);

    return (
        <section
            aria-labelledby="submitted-heading"
            className={`${panelClass} space-y-5`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 id="submitted-heading" className="text-xl font-medium">
                        {reviewed?.decision === 'reviewed'
                            ? 'Reviewed by CHED'
                            : reviewed?.decision === 'returned'
                              ? 'Returned for correction'
                              : 'Submitted to CHED'}
                    </h2>
                    {revision.submitted_at && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Submitted {localDate(revision.submitted_at)}
                            {revision.submitted_by &&
                                ` by ${revision.submitted_by}`}
                            .
                            {!reviewed &&
                                ' CHED reviews it and may return it with notes.'}
                        </p>
                    )}
                </div>
                {revision.document_code && (
                    <DocumentCode code={revision.document_code} />
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {revision.attachment && (
                    <Button variant="outline" asChild>
                        <a
                            href={revision.attachment.inline_url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <ExternalLink />
                            View signed copy
                            <span className="sr-only">
                                {' '}
                                (opens in a new tab)
                            </span>
                        </a>
                    </Button>
                )}
                <PdfButton
                    variant="ghost"
                    input={() => pdfInput(report, revision, template, office)}
                >
                    Download the form as finalized
                </PdfButton>
            </div>
        </section>
    );
}
