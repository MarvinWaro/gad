import type { CertificateDocument } from '../types/certificates';
import { paperColors } from './certificate-page';
import {
    buildCertificateDocument,
    certificateFileName,
} from './certificate-pdf';
import type { CertificateImage, CertificateImages } from './certificate-pdf';
import { loadPdfMake, PDF_IMAGE_FILES } from './monitoring-pdf-download';
import { renderFirstPage } from './pdf-first-page';
import type { FirstPage } from './pdf-first-page';

/**
 * A certificate made in the browser (lib/certificate-pdf.ts): downloaded as
 * its PDF, or drawn from that same PDF as the editor's preview, so what the
 * office sees is what people get.
 */

/** Pictures already read, by address: the editor redraws often. */
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

async function read(src: string): Promise<CertificateImage> {
    const response = await fetch(new URL(src, window.location.origin), {
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(`A picture could not be loaded (${response.status}).`);
    }

    const blob = await response.blob();
    const [bitmap, source] = await Promise.all([
        createImageBitmap(blob),
        dataUrl(blob),
    ]);
    const image = { src: source, width: bitmap.width, height: bitmap.height };
    bitmap.close();

    return image;
}

/** A picture, read once; a failure is tried again next time. */
function image(src: string): Promise<CertificateImage> {
    let picture = loaded.get(src);

    if (!picture) {
        picture = read(src);
        picture.catch(() => loaded.delete(src));
        loaded.set(src, picture);
    }

    return picture;
}

async function images(
    document: CertificateDocument,
): Promise<CertificateImages> {
    const [chedSeal, bagongPilipinas, logos, signatures] = await Promise.all([
        image(PDF_IMAGE_FILES.chedSeal),
        image(PDF_IMAGE_FILES.bagongPilipinas),
        Promise.all(document.logos.map(image)),
        Promise.all(
            document.signatories.map((signatory) => image(signatory.signature)),
        ),
    ]);

    return { chedSeal, bagongPilipinas, logos, signatures };
}

async function build(certificate: CertificateDocument) {
    const [pdfMake, pictures] = await Promise.all([
        loadPdfMake(),
        images(certificate),
    ]);

    return pdfMake.createPdf(
        buildCertificateDocument(certificate, pictures, paperColors()),
    );
}

/** The certificate as an A4 landscape PDF, saved to the person's device. */
export async function downloadCertificatePdf(
    certificate: CertificateDocument,
): Promise<void> {
    await (
        await build(certificate)
    ).download(certificateFileName(certificate.number));
}

/** The certificate's page, drawn `width` pixels wide from its own PDF. */
export async function previewCertificate(
    certificate: CertificateDocument,
    width: number,
    signal: AbortSignal,
): Promise<FirstPage> {
    const pdf = await (await build(certificate)).getBlob();
    signal.throwIfAborted();
    const url = URL.createObjectURL(pdf);

    try {
        return await renderFirstPage(url, width, signal);
    } finally {
        URL.revokeObjectURL(url);
    }
}
