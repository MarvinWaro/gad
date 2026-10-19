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

let worker: InstanceType<PdfJs['PDFWorker']> | null = null;

/**
 * One pdf.js worker for every page drawn, started once: a worker per
 * document would load and start pdf.js again each time, which is most of a
 * redraw's wait.
 */
function sharedWorker(pdfjs: PdfJs): InstanceType<PdfJs['PDFWorker']> {
    if (!worker || worker.destroyed) {
        worker = new pdfjs.PDFWorker();
    }

    return worker;
}

type PdfSource = { url: string } | { data: Uint8Array };
type PdfDocument = Awaited<ReturnType<PdfJs['getDocument']>['promise']>;

/** Opens a PDF for `use`, and closes it after, or when `signal` aborts. */
async function withPdf<T>(
    source: PdfSource,
    signal: AbortSignal,
    use: (pdf: PdfDocument) => Promise<T>,
): Promise<T> {
    const pdfjs = await loadPdfJs();
    signal.throwIfAborted();
    const task = pdfjs.getDocument({
        ...source,
        worker: sharedWorker(pdfjs),
        verbosity: pdfjs.VerbosityLevel.ERRORS,
        BinaryDataFactory: BundledBinaryData,
    });
    const cancel = () => void task.destroy();
    signal.addEventListener('abort', cancel, { once: true });

    try {
        return await use(await task.promise);
    } finally {
        signal.removeEventListener('abort', cancel);
        await task.destroy();
    }
}

/** One page drawn onto a new canvas `width` pixels wide. */
async function drawPage(
    pdf: PdfDocument,
    number: number,
    width: number,
): Promise<HTMLCanvasElement> {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({
        scale: width / page.getViewport({ scale: 1 }).width,
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;

    return canvas;
}

/** A drawn page as an image; revoke the URL when done. */
async function imageOf(canvas: HTMLCanvasElement): Promise<string> {
    const image = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.9),
    );

    if (!image) {
        throw new Error('The page could not be drawn.');
    }

    return URL.createObjectURL(image);
}

/**
 * Draws page 1 of a PDF, from its address or its bytes, onto a new canvas
 * `width` pixels wide.
 */
export function drawFirstPage(
    source: PdfSource,
    width: number,
    signal: AbortSignal,
): Promise<{ canvas: HTMLCanvasElement; pages: number }> {
    return withPdf(source, signal, async (pdf) => ({
        canvas: await drawPage(pdf, 1, width),
        pages: pdf.numPages,
    }));
}

/**
 * Draws every page of a PDF as images `width` pixels wide, in order, to
 * read on screen without downloading it. Revoke the URLs when done.
 */
export function renderPages(
    data: Uint8Array,
    width: number,
    signal: AbortSignal,
): Promise<string[]> {
    return withPdf({ data }, signal, async (pdf) => {
        const pages: string[] = [];

        try {
            for (let number = 1; number <= pdf.numPages; number++) {
                signal.throwIfAborted();
                pages.push(await imageOf(await drawPage(pdf, number, width)));
            }
        } catch (error) {
            pages.forEach((src) => URL.revokeObjectURL(src));
            throw error;
        }

        return pages;
    });
}

/** Draws page 1 of a PDF as an image `width` pixels wide. */
export async function renderFirstPage(
    url: string,
    width: number,
    signal: AbortSignal,
): Promise<FirstPage> {
    const { canvas, pages } = await drawFirstPage({ url }, width, signal);

    return { src: await imageOf(canvas), pages };
}
