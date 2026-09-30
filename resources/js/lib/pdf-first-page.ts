import jbig2Wasm from 'pdfjs-dist/wasm/jbig2.wasm?url';
import openjpegWasm from 'pdfjs-dist/wasm/openjpeg.wasm?url';

type PdfJs = typeof import('pdfjs-dist');

export type FirstPage = {
    /** An object URL for the drawn page; revoke it when done. */
    src: string;
    pages: number;
};

// Scanners often compress with JBIG2 or JPEG 2000, which pdf.js decodes with
// these. The bundler renames them, so they are handed over by file name.
const WASM: Record<string, string> = {
    'jbig2.wasm': jbig2Wasm,
    'openjpeg.wasm': openjpegWasm,
};

class BundledBinaryData {
    async fetch({
        kind,
        filename,
    }: {
        kind: string;
        filename: string;
    }): Promise<Uint8Array> {
        const url = kind === 'wasmUrl' ? WASM[filename] : undefined;

        if (!url) {
            throw new Error(`No bundled ${kind} file ${filename}.`);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Could not load ${filename}.`);
        }

        return new Uint8Array(await response.arrayBuffer());
    }
}

let loading: Promise<PdfJs> | null = null;

/** pdf.js and its worker load the first time a page is drawn. */
function loadPdfJs(): Promise<PdfJs> {
    loading ??= Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(
        ([pdfjs, worker]) => {
            pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

            return pdfjs;
        },
        (error: unknown) => {
            loading = null;
            throw error;
        },
    );

    return loading;
}

/** Draws page 1 of a PDF as an image `width` pixels wide. */
export async function renderFirstPage(
    url: string,
    width: number,
    signal: AbortSignal,
): Promise<FirstPage> {
    const pdfjs = await loadPdfJs();
    signal.throwIfAborted();
    const task = pdfjs.getDocument({
        url,
        verbosity: pdfjs.VerbosityLevel.ERRORS,
        BinaryDataFactory: BundledBinaryData,
    });
    const cancel = () => void task.destroy();
    signal.addEventListener('abort', cancel, { once: true });

    try {
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({
            scale: width / page.getViewport({ scale: 1 }).width,
        });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvas, viewport }).promise;
        const image = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/webp', 0.9),
        );

        if (!image) {
            throw new Error('The page could not be drawn.');
        }

        return { src: URL.createObjectURL(image), pages: pdf.numPages };
    } finally {
        signal.removeEventListener('abort', cancel);
        await task.destroy();
    }
}
