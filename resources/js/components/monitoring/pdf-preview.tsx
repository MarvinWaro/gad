import { Eye } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import type { MonitoringPdfInput } from '@/lib/monitoring-pdf';
import {
    monitoringPdfBytes,
    preloadMonitoringPdf,
} from '@/lib/monitoring-pdf-download';
import { renderPages } from '@/lib/pdf-first-page';
import { toast } from '@/lib/toast';

/** Wide enough for the dialog on a sharp screen, small enough to draw fast. */
const PAGE_WIDTH = 760;

/**
 * Shows the report's PDF in a dialog, page by page, without downloading
 * it: the same PDF a download would give, drawn as pictures so it reads the
 * same on phones, which cannot show a PDF inside a page.
 */
export function PdfPreview({
    input,
    before,
    title,
    children,
    ...props
}: {
    /** Read when clicked, so it carries the latest saved answers. */
    input: () => MonitoringPdfInput;
    /** Runs first, such as saving what is waiting; false stops the preview. */
    before?: () => Promise<boolean>;
    title: string;
    children: ReactNode;
} & Omit<ComponentProps<typeof Button>, 'onClick' | 'children' | 'title'>) {
    const [busy, setBusy] = useState(false);
    const [pdf, setPdf] = useState<Uint8Array | null>(null);

    async function open() {
        setBusy(true);

        try {
            if (before && !(await before())) {
                return;
            }

            setPdf(await monitoringPdfBytes(input()));
        } catch {
            toast.error('The preview could not be prepared.', {
                description:
                    'Check your connection, reload the page, and try again.',
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <Button
                type="button"
                {...props}
                disabled={busy || props.disabled}
                onPointerEnter={preloadMonitoringPdf}
                onFocus={preloadMonitoringPdf}
                onClick={() => void open()}
            >
                {busy ? <Spinner /> : <Eye />}
                {busy ? 'Preparing preview…' : children}
            </Button>
            <Dialog
                open={pdf !== null}
                onOpenChange={(isOpen) => !isOpen && setPdf(null)}
            >
                <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            The report as it prints now, with the answers saved
                            so far. Nothing is downloaded.
                        </DialogDescription>
                    </DialogHeader>
                    {pdf && <Pages pdf={pdf} />}
                </DialogContent>
            </Dialog>
        </>
    );
}

/** The PDF's pages, one under another, drawn when the dialog opens. */
function Pages({ pdf }: { pdf: Uint8Array }) {
    const [pages, setPages] = useState<string[] | 'failed' | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        let drawn: string[] = [];

        // A copy: pdf.js takes the bytes it is given for its worker.
        renderPages(
            pdf.slice(),
            PAGE_WIDTH * Math.min(window.devicePixelRatio || 1, 2),
            controller.signal,
        ).then(
            (srcs) => {
                if (controller.signal.aborted) {
                    srcs.forEach((src) => URL.revokeObjectURL(src));

                    return;
                }

                drawn = srcs;
                setPages(srcs);
            },
            () => {
                if (!controller.signal.aborted) {
                    setPages('failed');
                }
            },
        );

        return () => {
            controller.abort();
            drawn.forEach((src) => URL.revokeObjectURL(src));
        };
    }, [pdf]);

    if (pages === 'failed') {
        return (
            <p className="text-sm text-muted-foreground">
                The pages could not be shown. Try again, or download the PDF
                from the next step.
            </p>
        );
    }

    return (
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto bg-muted px-4 py-4 sm:px-6">
            {pages === null ? (
                <div aria-busy="true">
                    <p role="status" className="sr-only">
                        Preparing the preview
                    </p>
                    <Skeleton className="mx-auto aspect-[8.5/13] w-full max-w-2xl" />
                </div>
            ) : (
                <ol className="mx-auto max-w-2xl space-y-4">
                    {pages.map((src, index) => (
                        <li key={src}>
                            <img
                                src={src}
                                alt={`Page ${index + 1} of ${pages.length}`}
                                className="w-full rounded-sm shadow-sm"
                            />
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
