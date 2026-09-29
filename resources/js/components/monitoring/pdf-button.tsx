import { Download } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { MonitoringPdfInput } from '@/lib/monitoring-pdf';
import {
    downloadMonitoringPdf,
    preloadMonitoringPdf,
} from '@/lib/monitoring-pdf-download';
import { toast } from '@/lib/toast';
import type {
    MonitoringDetails,
    MonitoringReport,
    MonitoringRevision,
    MonitoringTemplate,
    RegionOffice,
} from '@/types/monitoring';

/** The printable report for one revision, as the server has it. */
export function pdfInput(
    report: MonitoringReport,
    revision: MonitoringRevision,
    template: MonitoringTemplate,
    office: RegionOffice | null,
    values?: { details: MonitoringDetails; answers: Record<string, string> },
): MonitoringPdfInput {
    return {
        template,
        office,
        institutionName: report.place.hei.name,
        academicYear: report.academic_year,
        semester: report.semester,
        revisionNumber: revision.number,
        documentCode: revision.document_code,
        details: values?.details ?? revision.details,
        answers: values?.answers ?? revision.answers,
    };
}

/**
 * Builds the PDF in the browser and saves it. The PDF library loads when the
 * pointer or focus comes near, so most clicks start at once.
 */
export function PdfButton({
    input,
    before,
    children,
    ...props
}: {
    /** Read when clicked, so it carries the latest saved answers. */
    input: () => MonitoringPdfInput;
    /** Runs first, such as saving what is waiting; false stops the download. */
    before?: () => Promise<boolean>;
    children: ReactNode;
} & Omit<ComponentProps<typeof Button>, 'onClick' | 'children'>) {
    const [busy, setBusy] = useState(false);

    async function download() {
        setBusy(true);

        try {
            if (before && !(await before())) {
                return;
            }

            await downloadMonitoringPdf(input());
        } catch {
            toast.error('The PDF could not be prepared.', {
                description:
                    'Check your connection, reload the page, and try again.',
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Button
            type="button"
            {...props}
            disabled={busy || props.disabled}
            onPointerEnter={preloadMonitoringPdf}
            onFocus={preloadMonitoringPdf}
            onClick={() => void download()}
        >
            {busy ? <Spinner /> : <Download />}
            {busy ? 'Preparing PDF…' : children}
        </Button>
    );
}
