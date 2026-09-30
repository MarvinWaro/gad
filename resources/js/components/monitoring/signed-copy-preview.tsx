import { FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { renderFirstPage } from '@/lib/pdf-first-page';
import type { FirstPage } from '@/lib/pdf-first-page';

// About 60vh tall at the long bond paper's 8.5 × 13 in proportion.
const paperClass = 'mx-auto aspect-[8.5/13] w-full max-w-[39vh]';

/**
 * The signed copy's first page, laid on the desk like paper. Pointer users
 * open the whole PDF by clicking it; the panel's Open button does the same
 * from the keyboard. Remount with a `key` when the file changes.
 */
export function SignedCopyPreview({
    url,
    revision,
}: {
    url: string;
    revision: number;
}) {
    const [preview, setPreview] = useState<FirstPage | 'failed' | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        let src: string | null = null;

        renderFirstPage(
            url,
            720 * Math.min(window.devicePixelRatio || 1, 2),
            controller.signal,
        ).then(
            (page) => {
                if (controller.signal.aborted) {
                    URL.revokeObjectURL(page.src);

                    return;
                }

                src = page.src;
                setPreview(page);
            },
            () => {
                if (!controller.signal.aborted) {
                    setPreview('failed');
                }
            },
        );

        return () => {
            controller.abort();

            if (src) {
                URL.revokeObjectURL(src);
            }
        };
    }, [url]);

    return (
        <figure className="rounded-lg bg-muted p-4 sm:p-6">
            {preview === null ? (
                <div role="status">
                    <Skeleton className={paperClass} />
                    <span className="sr-only">Loading the first page…</span>
                </div>
            ) : preview === 'failed' ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-sm text-muted-foreground">
                    <FileText aria-hidden className="size-6" />
                    <p>
                        This file can&rsquo;t be previewed here. Open it to see
                        the signed copy.
                    </p>
                </div>
            ) : (
                <>
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        tabIndex={-1}
                        className="group mx-auto block w-fit max-w-full"
                    >
                        <img
                            src={preview.src}
                            alt={`First page of the signed copy, revision ${revision}`}
                            className="max-h-[60vh] w-auto max-w-full rounded-sm shadow-md ring-1 ring-border transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
                        />
                    </a>
                    <figcaption className="mt-4 text-center text-xs text-muted-foreground">
                        Page 1 of {preview.pages}
                        {preview.pages > 1 && ' · Open to see every page'}
                    </figcaption>
                </>
            )}
        </figure>
    );
}
