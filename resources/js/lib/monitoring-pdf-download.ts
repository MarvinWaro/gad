import {
    buildMonitoringDocument,
    monitoringPdfFileName,
    needsFallbackFont,
    PDF_FONTS,
} from './monitoring-pdf';
import type { MonitoringPdfInput, PDF_IMAGES } from './monitoring-pdf';

type PdfMake = typeof import('pdfmake/build/pdfmake');
type FontFiles = Record<string, { normal: string; bold: string }>;

// Served from public/fonts/pdf, with their licences beside them.
const FONTS: FontFiles = {
    [PDF_FONTS.body]: {
        normal: 'LiberationSansNarrow-Regular.ttf',
        bold: 'LiberationSansNarrow-Bold.ttf',
    },
    [PDF_FONTS.letterhead]: {
        normal: 'texgyrebonum-regular.otf',
        bold: 'texgyrebonum-bold.otf',
    },
};
const FALLBACK_FONTS: FontFiles = {
    [PDF_FONTS.fallback]: {
        normal: 'LiberationSans-Regular.ttf',
        bold: 'LiberationSans-Bold.ttf',
    },
};

// The official marks, used as they are; the letterhead's own copies come
// from the Word template.
const IMAGES: Record<(typeof PDF_IMAGES)[number], string> = {
    chedSeal: '/assets/img/ched_logo.png',
    bagongPilipinas: '/assets/img/letterhead/bagong-pilipinas.png',
    envelope: '/assets/img/letterhead/envelope.png',
    phone: '/assets/img/letterhead/phone.png',
};

let loading: Promise<PdfMake> | null = null;
let fallbackAdded = false;

/** pdfmake fetches fonts and images only from absolute URLs. */
function absolute(path: string): string {
    return new URL(path, window.location.origin).href;
}

function fontUrls(files: FontFiles): FontFiles {
    return Object.fromEntries(
        Object.entries(files).map(([family, faces]) => [
            family,
            {
                normal: absolute(`/fonts/pdf/${faces.normal}`),
                bold: absolute(`/fonts/pdf/${faces.bold}`),
            },
        ]),
    );
}

/** pdfmake is large, so it loads only when someone asks for a PDF. */
function loadPdfMake(): Promise<PdfMake> {
    loading ??= import('pdfmake/build/pdfmake')
        .then((module) => {
            const pdfMake = ((module as { default?: PdfMake }).default ??
                module) as PdfMake;
            pdfMake.addFonts(fontUrls(FONTS));

            return pdfMake;
        })
        .catch((error: unknown) => {
            // Let the next click try again, as after a new deploy.
            loading = null;

            throw error;
        });

    return loading;
}

/** Start loading ahead of a likely click, so the download begins sooner. */
export function preloadMonitoringPdf(): void {
    loadPdfMake().catch(() => undefined);
}

/** Build the report as a PDF and save it to the person's device. */
export async function downloadMonitoringPdf(
    input: MonitoringPdfInput,
): Promise<void> {
    const pdfMake = await loadPdfMake();

    if (!fallbackAdded && needsFallbackFont(input)) {
        pdfMake.addFonts(fontUrls(FALLBACK_FONTS));
        fallbackAdded = true;
    }

    const document = buildMonitoringDocument(input);
    document.images = Object.fromEntries(
        Object.entries(IMAGES).map(([name, path]) => [name, absolute(path)]),
    );

    await pdfMake.createPdf(document).download(monitoringPdfFileName(input));
}
