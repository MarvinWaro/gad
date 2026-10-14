import { FileDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { PAGE } from '@/lib/certificate-page';
import { drawWidth, redrawDelay } from '@/lib/certificate-preview';
import { isMissingPictures, missingPictures } from '@/lib/certificate-text';
import { toast } from '@/lib/toast';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { CertificateDocument } from '@/types/certificates';

type Drawn = {
    status: 'drawing' | 'ready' | 'failed';
    /** A page is on show: the last one drawn stays until the next replaces it. */
    shown: boolean;
    missing: string[];
};

/**
 * The certificate as it prints, drawn from its own PDF (one document for
 * the preview and the download) straight onto a canvas, with a sample PDF
 * to download. A pick redraws at once; typing in the wording waits for a
 * pause (lib/certificate-preview.ts).
 */
export function CertificatePreview({
    certificate,
}: {
    certificate: CertificateDocument;
}) {
    const [drawn, setDrawn] = useState<Drawn>({
        status: 'drawing',
        shown: false,
        missing: [],
    });
    const [saving, setSaving] = useState(false);
    const frame = useRef<HTMLDivElement>(null);
    const scheduled = useRef<CertificateDocument | null>(null);
    const key = JSON.stringify(certificate);

    useEffect(() => {
        const next = JSON.parse(key) as CertificateDocument;
        const delay = redrawDelay(scheduled.current, next);
        scheduled.current = next;
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setDrawn((current) => ({ ...current, status: 'drawing' }));
            import('@/lib/certificate-pdf-download')
                .then((pdf) =>
                    pdf.previewCertificate(
                        next,
                        drawWidth(
                            frame.current?.clientWidth ?? 0,
                            window.devicePixelRatio || 1,
                        ),
                        controller.signal,
                    ),
                )
                .then(
                    (page) => {
                        if (controller.signal.aborted || !frame.current) {
                            return;
                        }

                        frame.current.replaceChildren(page.canvas);
                        setDrawn({
                            status: 'ready',
                            shown: true,
                            missing: page.missing,
                        });
                    },
                    () => {
                        if (!controller.signal.aborted) {
                            frame.current?.replaceChildren();
                            setDrawn({
                                status: 'failed',
                                shown: false,
                                missing: [],
                            });
                        }
                    },
                );
        }, delay);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [key]);

    async function download() {
        setSaving(true);

        try {
            const pdf = await import('@/lib/certificate-pdf-download');
            await pdf.downloadCertificatePdf(certificate);
        } catch (error) {
            toast.error(
                isMissingPictures(error)
                    ? `${error.message}, so the sample wasn’t made. Upload ${error.missing.length === 1 ? 'it' : 'them'} again.`
                    : 'The sample could not be made. Check the logos and signatures, then try again.',
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
                {/* The drawn page's canvas is placed here, outside React. */}
                <div
                    ref={frame}
                    role={drawn.shown ? 'img' : undefined}
                    aria-label={
                        drawn.shown
                            ? `Preview of the ${certificate.title}, signed by ${certificate.signatories.map((signatory) => signatory.name).join(', ') || 'no one yet'}.`
                            : undefined
                    }
                    className="size-full [&>canvas]:block [&>canvas]:size-full"
                />
                {drawn.status === 'failed' ? (
                    <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-paper-foreground/70">
                        The preview couldn&apos;t be drawn. Check the logos and
                        signatures, or reload the page.
                    </p>
                ) : (
                    !drawn.shown && (
                        <Skeleton className="absolute inset-0 rounded-none" />
                    )
                )}
                {drawn.status === 'drawing' && drawn.shown && (
                    <span className="absolute top-2 right-2 rounded-full bg-media-panel p-1.5 text-white">
                        <Spinner />
                        <span className="sr-only">Drawing the preview</span>
                    </span>
                )}
            </div>
            {drawn.missing.length > 0 && (
                <p
                    role="alert"
                    className={cn(
                        'rounded-lg px-3 py-2 text-[13px] text-pretty',
                        tones.warning.badge,
                    )}
                >
                    {missingPictures(drawn.missing)}, so the preview leaves{' '}
                    {drawn.missing.length === 1 ? 'it' : 'them'} out and
                    certificates can&apos;t be downloaded. Upload{' '}
                    {drawn.missing.length === 1 ? 'it' : 'them'} again.
                </p>
            )}
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
