import type { CertificateDocument } from '../types/certificates';
import { paperColors } from './certificate-page';
import {
    buildCertificateDocument,
    certificateFileName,
} from './certificate-pdf';
import type { CertificateImage, CertificateImages } from './certificate-pdf';
import { missingPictures } from './certificate-text';
import { loadPdfMake, PDF_IMAGE_FILES } from './monitoring-pdf-download';
import { drawFirstPage } from './pdf-first-page';

/**
 * A certificate made in the browser (lib/certificate-pdf.ts): downloaded as
 * its PDF, or drawn from that same PDF as the editor's preview, so what the
 * office sees is what people get.
 */

/**
 * The longest side, in pixels, of the pictures in the editor's preview: as
 * sharp as the preview ever shows a logo or signature, and far quicker to
 * put in a PDF and draw than the files themselves (the CHED seal is 1920 px,
 * a signature up to 4000 px). Downloads always print the files as they are.
 */
const PREVIEW_PICTURE = 512;

/** Pictures already read, by size and address: the editor redraws often. */
const loaded = new Map<string, Promise<CertificateImage>>();

function dataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
            typeof reader.result === 'string'
                ? resolve(reader.result)
                : reject(new Error('The picture could not be read.'));
        reader.onerror = () =>
            reject(reader.error ?? new Error('The picture could not be read.'));
        reader.readAsDataURL(blob);
    });
}

/** A picture as it is, or shrunk to `longest` pixels for the preview. */
async function read(
    src: string,
    longest: number | null,
): Promise<CertificateImage> {
    const response = await fetch(new URL(src, window.location.origin), {
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(`A picture could not be loaded (${response.status}).`);
    }

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    try {
        const scale = longest
            ? Math.min(1, longest / Math.max(bitmap.width, bitmap.height))
            : 1;

        if (scale === 1) {
            return {
                src: await dataUrl(blob),
                width: bitmap.width,
                height: bitmap.height,
            };
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('The picture could not be read.');
        }

        context.imageSmoothingQuality = 'high';
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        return {
            src: canvas.toDataURL('image/png'),
            width: canvas.width,
            height: canvas.height,
        };
    } finally {
        bitmap.close();
    }
}

/** A picture, read once at each size; a failure is tried again next time. */
function image(src: string, longest: number | null): Promise<CertificateImage> {
    const key = `${longest ?? 'full'} ${src}`;
    let picture = loaded.get(key);

    if (!picture) {
        picture = read(src, longest);
        picture.catch(() => loaded.delete(key));
        loaded.set(key, picture);
    }

    return picture;
}

/**
 * The pictures to print, and the uploaded ones that couldn't be loaded,
 * named in order ("extra logo 2", "the e-signature of Maria Santos"), such
 * as a file whose storage is gone: those are left out, never the whole
 * page. The CHED seal and Bagong Pilipinas come with the site, so they
 * must load.
 */
async function images(
    document: CertificateDocument,
    longest: number | null,
): Promise<{ pictures: CertificateImages; missing: string[] }> {
    const uploaded = (src: string) => image(src, longest).catch(() => null);
    const [chedSeal, bagongPilipinas, logos, signatures] = await Promise.all([
        image(PDF_IMAGE_FILES.chedSeal, longest),
        image(PDF_IMAGE_FILES.bagongPilipinas, longest),
        Promise.all(document.logos.map(uploaded)),
        Promise.all(
            document.signatories.map((signatory) =>
                uploaded(signatory.signature),
            ),
        ),
    ]);

    return {
        pictures: {
            chedSeal,
            bagongPilipinas,
            logos: logos.filter((logo) => logo !== null),
            signatures,
        },
        missing: [
            ...logos.flatMap((logo, index) =>
                logo ? [] : [`extra logo ${index + 1}`],
            ),
            ...document.signatories.flatMap((signatory, index) =>
                signatures[index]
                    ? []
                    : [`the e-signature of ${signatory.name}`],
            ),
        ],
    };
}

/**
 * The certificate's PDF. For the preview, which only this page reads, its
 * pictures are preview-sized and it is left uncompressed: both make it
 * quicker to build and to draw.
 */
async function build(
    certificate: CertificateDocument,
    { preview = false }: { preview?: boolean } = {},
) {
    const [pdfMake, { pictures, missing }] = await Promise.all([
        loadPdfMake(),
        images(certificate, preview ? PREVIEW_PICTURE : null),
    ]);

    return {
        pdf: pdfMake.createPdf({
            ...buildCertificateDocument(certificate, pictures, paperColors()),
            compress: !preview,
        }),
        missing,
    };
}

/**
 * A download refused because a logo or e-signature couldn't be loaded: a
 * certificate is never handed out without them. Its message names them.
 */
export class MissingPicturesError extends Error {
    readonly missing: string[];

    constructor(missing: string[]) {
        super(missingPictures(missing));
        this.name = 'MissingPicturesError';
        this.missing = missing;
    }
}

/**
 * The certificate as an A4 landscape PDF, saved to the person's device.
 *
 * @throws MissingPicturesError when a logo or e-signature couldn't be loaded
 */
export async function downloadCertificatePdf(
    certificate: CertificateDocument,
): Promise<void> {
    const { pdf, missing } = await build(certificate);

    if (missing.length > 0) {
        throw new MissingPicturesError(missing);
    }

    await pdf.download(certificateFileName(certificate.number));
}

/**
 * The certificate's page, drawn on a canvas `width` pixels wide from its own
 * PDF (its preview build). A logo or e-signature that couldn't be loaded is
 * left out and named in `missing`, so the editor can say so.
 */
export async function previewCertificate(
    certificate: CertificateDocument,
    width: number,
    signal: AbortSignal,
): Promise<{ canvas: HTMLCanvasElement; missing: string[] }> {
    const { pdf, missing } = await build(certificate, { preview: true });
    const data = await pdf.getBuffer();
    signal.throwIfAborted();
    const { canvas } = await drawFirstPage(
        { data: new Uint8Array(data) },
        width,
        signal,
    );

    return { canvas, missing };
}
