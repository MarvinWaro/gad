import { FileDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { getJson } from '@/hooks/use-inbox';
import { toast } from '@/lib/toast';
import { document as certificateDocument } from '@/routes/certificates';
import type { CertificateDocument } from '@/types/certificates';

/**
 * "Download PDF" for one certificate: its contents come from the server
 * (`CertificateDocumentResource`), and the PDF is made here, with the PDF
 * code loaded only on the first click.
 */
export function DownloadCertificateButton({
    id,
    label = 'Download PDF',
    compact = false,
}: {
    id: string;
    /** The button's accessible name, when its text alone isn't enough. */
    label?: string;
    compact?: boolean;
}) {
    const [busy, setBusy] = useState(false);

    async function download() {
        setBusy(true);

        try {
            const [certificate, pdf] = await Promise.all([
                getJson<CertificateDocument>(certificateDocument.url(id)),
                import('@/lib/certificate-pdf-download'),
            ]);

            if (!certificate) {
                throw new Error('The certificate could not be read.');
            }

            await pdf.downloadCertificatePdf(certificate);
        } catch {
            toast.error(
                'The certificate could not be made. Check the connection, then try again.',
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'default'}
            className={compact ? 'min-h-10' : undefined}
            disabled={busy}
            aria-label={label === 'Download PDF' ? undefined : label}
            onClick={() => void download()}
        >
            {busy ? <Spinner /> : <FileDown />}
            Download PDF
        </Button>
    );
}
