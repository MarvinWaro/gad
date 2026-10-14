import type { Column, Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { CertificateDocument } from '../types/certificates';
import {
    backgroundSvg,
    bodySize,
    CONTENT_WIDTH,
    fit,
    LAYOUT,
    MARGIN,
    nameSize,
    PAGE,
    QR_LEFT,
    qrSvg,
    signatoryRowLeft,
} from './certificate-page';
import type { CertificateColors } from './certificate-page';
import {
    attendedDays,
    certificateDates,
    fillBlanks,
    formalDate,
} from './certificate-text';
import { NATIONAL_OFFICES, PDF_FONTS, REPUBLIC } from './monitoring-pdf';

/**
 * A certificate as a one-page A4 landscape PDF (docs/certificates.md): the
 * background, the CHED letterhead with any extra logos, the title, the name
 * in capitals, the wording with its blanks filled, one to three signatories
 * in a fixed row, and the number with its verify QR. It only lays out:
 * certificate-pdf-download.ts loads the pictures and renders it, for the
 * download and the editor's preview alike. Where things sit, and the words
 * it fills in, are certificate-page.ts's and certificate-text.ts's.
 */

/** A picture as loaded, with its own size, so it can be fitted. */
export type CertificateImage = { src: string; width: number; height: number };

export type CertificateImages = {
    chedSeal: CertificateImage;
    bagongPilipinas: CertificateImage;
    logos: CertificateImage[];
    /** One per signatory, in order; null when it couldn't be loaded. */
    signatures: (CertificateImage | null)[];
};

function logoRow(images: CertificateImages): Content {
    const marks = [images.chedSeal, ...images.logos, images.bagongPilipinas];
    const columns: Column[] = marks.map((image) => {
        const size = fit(image, LAYOUT.logo * 1.6, LAYOUT.logo);

        return {
            width: size.width,
            stack: [
                {
                    image: image.src,
                    width: size.width,
                    height: size.height,
                    margin: [0, (LAYOUT.logo - size.height) / 2, 0, 0],
                },
            ],
        };
    });

    return {
        columns: [
            { width: '*', text: '' },
            ...columns,
            { width: '*', text: '' },
        ],
        columnGap: 12,
    };
}

function letterhead(document: CertificateDocument): Content {
    const lines: Content[] = [
        { text: REPUBLIC },
        ...NATIONAL_OFFICES.map((text) => ({ text, bold: true })),
    ];

    if (document.office) {
        lines.push({ text: document.office.name.toUpperCase(), bold: true });

        if (document.office.city) {
            lines.push({ text: document.office.city });
        }
    }

    return {
        stack: lines,
        font: PDF_FONTS.letterhead,
        fontSize: 10,
        lineHeight: 0.95,
        alignment: 'center',
        margin: [0, 6, 0, 0],
    };
}

function signatories(
    document: CertificateDocument,
    images: CertificateImages,
    colors: CertificateColors,
): Content {
    const count = document.signatories.length;

    return {
        absolutePosition: {
            x: signatoryRowLeft(count),
            y: LAYOUT.signatoriesTop,
        },
        columnGap: LAYOUT.signatoryGap,
        columns: document.signatories.map((signatory, index): Column => {
            const signature = images.signatures[index];
            const size = signature
                ? fit(
                      signature,
                      LAYOUT.signature.width,
                      LAYOUT.signature.height,
                  )
                : null;

            return {
                width: LAYOUT.signatoryWidth,
                stack: [
                    // Sitting on the line, whatever the picture's shape.
                    signature && size
                        ? {
                              image: signature.src,
                              width: size.width,
                              height: size.height,
                              alignment: 'center',
                              margin: [
                                  0,
                                  LAYOUT.signature.height - size.height,
                                  0,
                                  0,
                              ],
                          }
                        : {
                              text: '',
                              margin: [0, LAYOUT.signature.height, 0, 0],
                          },
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 10,
                                y1: 2,
                                x2: LAYOUT.signatoryWidth - 10,
                                y2: 2,
                                lineWidth: 0.75,
                                lineColor: colors.ink,
                            },
                        ],
                    },
                    {
                        text: signatory.name.toUpperCase(),
                        bold: true,
                        fontSize: 10.5,
                        margin: [0, 4, 0, 0],
                    },
                    {
                        text: signatory.position,
                        fontSize: 9.5,
                        opacity: 0.75,
                    },
                ],
                alignment: 'center',
            };
        }),
    };
}

/** Their institution or CHED office, under the name. */
function affiliation(text: string | null): Content[] {
    return text ? [{ text, fontSize: 13, margin: [0, 4, 0, 0] }] : [];
}

/**
 * The number and its QR, which opens the public verify page. The QR is the
 * server's modules (`CertificateNumber::qrRows`) drawn as one path on its
 * own paper square, so any background leaves it readable.
 */
function verification(
    document: CertificateDocument,
    colors: CertificateColors,
): Content[] {
    const address = document.verify_url.replace(/^https?:\/\//, '');

    return [
        {
            svg: qrSvg(document.qr, LAYOUT.qr, colors),
            width: LAYOUT.qr,
            height: LAYOUT.qr,
            absolutePosition: { x: QR_LEFT, y: LAYOUT.qrTop },
        },
        // Beside the QR, level with its foot, below even a position that
        // wraps: the second column keeps the words 10 pt clear of it.
        {
            columns: [
                {
                    width: '*',
                    stack: [
                        {
                            text: `Certificate no. ${document.number}`,
                            bold: true,
                            fontSize: 8.5,
                        },
                        {
                            text: `Verify it at ${address}`,
                            fontSize: 7.5,
                            opacity: 0.75,
                        },
                    ],
                    alignment: 'right',
                },
                { width: PAGE.width - MARGIN.x - QR_LEFT, text: '' },
            ],
            columnGap: 10,
            font: PDF_FONTS.body,
            absolutePosition: {
                x: PAGE.width / 2,
                y: LAYOUT.qrTop + LAYOUT.qr - 28,
            },
        },
    ];
}

export function buildCertificateDocument(
    document: CertificateDocument,
    images: CertificateImages,
    colors: CertificateColors,
): TDocumentDefinitions {
    const event = document.event;
    const body = fillBlanks(document.body, {
        event: event?.title ?? '',
        dates: event ? certificateDates(event.starts_at, event.ends_at) : '',
        days: attendedDays(document.days),
        venue: event?.location ?? '',
        released: formalDate(document.released_on),
    });

    return {
        pageSize: { width: PAGE.width, height: PAGE.height },
        pageMargins: [MARGIN.x, MARGIN.y, MARGIN.x, MARGIN.y],
        info: {
            title: `${document.title}: ${document.name}`,
            subject: event?.title,
            creator: 'PHLGADIS',
            producer: 'PHLGADIS',
        },
        background: {
            svg: backgroundSvg(document.background, colors),
            width: PAGE.width,
            height: PAGE.height,
        },
        defaultStyle: {
            font: PDF_FONTS.letterhead,
            color: colors.ink,
            alignment: 'center',
        },
        content: [
            logoRow(images),
            letterhead(document),
            {
                text: document.title.toUpperCase(),
                bold: true,
                fontSize: 30,
                color: colors.accent,
                characterSpacing: 1.2,
                margin: [0, 16, 0, 0],
            },
            { text: document.lead, fontSize: 14, margin: [0, 6, 0, 0] },
            {
                text: document.name,
                bold: true,
                fontSize: nameSize(document.name),
                margin: [0, 8, 0, 0],
            },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: (CONTENT_WIDTH - LAYOUT.nameRule) / 2,
                        y1: 2,
                        x2: (CONTENT_WIDTH + LAYOUT.nameRule) / 2,
                        y2: 2,
                        lineWidth: 0.75,
                        lineColor: colors.accent,
                    },
                ],
            },
            ...affiliation(document.affiliation),
            {
                text: body.map((run) => ({ text: run.text, bold: run.bold })),
                fontSize: bodySize(document.body),
                lineHeight: 1.25,
                margin: [70, 10, 70, 0],
            },
            // Before the signatories, so a long position that wraps stays on
            // top of the QR's quiet zone, never under it.
            ...verification(document, colors),
            signatories(document, images, colors),
        ],
    };
}

/** "PHLGADIS-Certificate-CERT-7K2M-Q9XA.pdf". */
export function certificateFileName(number: string): string {
    return `PHLGADIS-Certificate-${number}.pdf`;
}
