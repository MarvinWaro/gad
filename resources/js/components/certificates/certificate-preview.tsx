import { FileDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { PAGE } from '@/lib/certificate-page';
import { toast } from '@/lib/toast';
import type { CertificateDocument } from '@/types/certificates';

/** Typing settles before the page is drawn again. */
const DELAY_MS = 600;

/** Sharp at the preview's widest, and on high-density screens. */
const DRAW_WIDTH = 1400;

type Drawn =
    | { status: 'drawing'; src: string | null }
    | { status: 'ready'; src: string }
    | { status: 'failed'; src: null };

/**
 * The certificate as it prints, drawn from its own PDF (one document for
 * the preview and the download), redrawn a moment after each change, with
 * a sample PDF to download.
 */
export function CertificatePreview({
    certificate,
}: {
    certificate: CertificateDocument;
}) {
    const [drawn, setDrawn] = useState<Drawn>({ status: 'drawing', src: null });
    const [saving, setSaving] = useState(false);
    const key = JSON.stringify(certificate);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setDrawn((current) => ({ status: 'drawing', src: current.src }));
            import('@/lib/certificate-pdf-download')
                .then((pdf) =>
                    pdf.previewCertificate(
                        JSON.parse(key) as CertificateDocument,
                        DRAW_WIDTH,
                        controller.signal,
                    ),
                )
                .then(
                    (page) => {
                        if (controller.signal.aborted) {
                            URL.revokeObjectURL(page.src);

                            return;
                        }

                        setDrawn({ status: 'ready', src: page.src });
                    },
                    () => {
                        if (!controller.signal.aborted) {
                            setDrawn({ status: 'failed', src: null });
                        }
                    },
                );
        }, DELAY_MS);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [key]);

    // A page drawn before lives until the next replaces it.
    useEffect(
        () => () => {
            if (drawn.src) {
                URL.revokeObjectURL(drawn.src);
            }
        },
        [drawn.src],
    );

    async function download() {
        setSaving(true);

        try {
            const pdf = await import('@/lib/certificate-pdf-download');
            await pdf.downloadCertificatePdf(certificate);
        } catch {
            toast.error(
                'The sample could not be made. Check the logos and signatures, then try again.',
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section aria-labelledby="preview" className="space-y-3">
            <div>
                <h2 id="preview" className="font-medium">
                    Preview
                </h2>
                <p className="text-[13px] text-muted-foreground">
                    With a sample name and event. People&apos;s certificates
                    print their own.
                </p>
            </div>
            <div
                role="status"
                aria-live="polite"
                aria-busy={drawn.status === 'drawing'}
                className="relative overflow-hidden rounded-lg border bg-paper shadow-sm"
                style={{ aspectRatio: `${PAGE.width} / ${PAGE.height}` }}
            >
                {drawn.src ? (
                    <img
                        src={drawn.src}
                        alt={`Preview of the ${certificate.title}, signed by ${certificate.signatories.map((signatory) => signatory.name).join(', ') || 'no one yet'}.`}
                        className="block size-full"
                    />
                ) : drawn.status === 'failed' ? (
                    <p className="flex size-full items-center justify-center px-6 text-center text-sm text-paper-foreground/70">
                        The preview couldn&apos;t be drawn. Check the logos and
                        signatures, or reload the page.
                    </p>
                ) : (
                    <Skeleton className="size-full rounded-none" />
                )}
                {drawn.status === 'drawing' && drawn.src && (
                    <span className="absolute top-2 right-2 rounded-full bg-media-panel p-1.5 text-white">
                        <Spinner />
                        <span className="sr-only">Drawing the preview</span>
                    </span>
                )}
            </div>
            <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void download()}
            >
                {saving ? <Spinner /> : <FileDown />}
                Download sample PDF
            </Button>
        </section>
    );
}
