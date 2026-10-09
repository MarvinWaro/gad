import { loadPdfMake } from './monitoring-pdf-download';
import { PDF_FONTS } from './monitoring-pdf';
import { CARD_MM, CARD_RATIO, layoutCard, paintCard } from './virtual-id';
import type { CardColors, CardFonts, CardImages, CardText } from './virtual-id';

/** The official marks on the card, used as they are. */
const MARKS = {
    seal: '/assets/img/ched_logo.png',
    pilipinas: '/assets/img/bagong_pilipinas.png',
    mark: '/assets/img/gadicon.png',
} as const;

/** About 500 dpi on the printed card, and sharp on any phone screen. */
const EXPORT_WIDTH = 1080;

function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => resolve(image);
        // A missing picture leaves its place empty; the card still draws.
        image.onerror = () => resolve(null);
        image.src = src;
    });
}

/** The marks and the photo; the photo comes from this site (VirtualIdResource). */
export async function loadCardImages(
    photo: string | null,
): Promise<CardImages> {
    const [seal, pilipinas, mark, picture] = await Promise.all([
        loadImage(MARKS.seal),
        loadImage(MARKS.pilipinas),
        loadImage(MARKS.mark),
        photo ? loadImage(photo) : Promise.resolve(null),
    ]);

    return { seal, pilipinas, mark, photo: picture };
}

/** The card's colours and type, read from the design tokens. */
function tokens(): { colors: CardColors; fonts: CardFonts } {
    const style = getComputedStyle(document.documentElement);
    const token = (name: string) => style.getPropertyValue(`--${name}`).trim();

    return {
        colors: {
            paper: token('paper'),
            ink: token('paper-foreground'),
            accent: token('paper-accent'),
            tint: token('paper-tint'),
            pink: token('mark-pink'),
            blue: token('mark-blue'),
        },
        fonts: {
            sans: token('font-sans') || 'sans-serif',
            mono: token('font-mono') || 'monospace',
        },
    };
}

/** Draws the card on `canvas`, `width` pixels wide. */
export async function renderCard(
    canvas: HTMLCanvasElement,
    width: number,
    text: CardText,
    images: CardImages,
    qr: string[],
): Promise<void> {
    // The type must be loaded before it is measured and drawn.
    await document.fonts.ready;
    const context = canvas.getContext('2d');

    if (!context) {
        return;
    }

    const { colors, fonts } = tokens();
    const layout = layoutCard(text, width, fonts, (line, font) => {
        context.font = font;

        return context.measureText(line).width;
    });
    canvas.width = Math.round(layout.width);
    canvas.height = Math.round(layout.height);
    paintCard(context, layout, text, images, colors, qr);
}

async function exportCanvas(
    text: CardText,
    images: CardImages,
    qr: string[],
): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    await renderCard(canvas, EXPORT_WIDTH, text, images, qr);

    return canvas;
}

function fileName(code: string, extension: string): string {
    return `PHLGADIS-Virtual-ID-${code}.${extension}`;
}

function save(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The card as a PNG: lossless, so the QR's edges stay sharp. */
export async function downloadCardImage(
    text: CardText,
    images: CardImages,
    qr: string[],
): Promise<void> {
    const canvas = await exportCanvas(text, images, qr);
    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
    );

    if (!blob) {
        throw new Error('The card could not be drawn.');
    }

    save(blob, fileName(text.code, 'png'));
}

/** The card as a one-page PDF exactly wallet size, to print and cut out. */
export async function downloadCardPdf(
    text: CardText,
    images: CardImages,
    qr: string[],
): Promise<void> {
    const [canvas, pdfMake] = await Promise.all([
        exportCanvas(text, images, qr),
        loadPdfMake(),
    ]);
    const points = (mm: number) => (mm / 25.4) * 72;
    const width = points(CARD_MM.width);

    await pdfMake
        .createPdf({
            pageSize: { width, height: width * CARD_RATIO },
            pageMargins: [0, 0, 0, 0],
            info: {
                title: `PHLGADIS Virtual ID: ${text.name}`,
                creator: 'PHLGADIS',
                producer: 'PHLGADIS',
            },
            defaultStyle: { font: PDF_FONTS.body },
            content: [
                {
                    image: canvas.toDataURL('image/png'),
                    width,
                    height: width * CARD_RATIO,
                    absolutePosition: { x: 0, y: 0 },
                },
            ],
        })
        .download(fileName(text.code, 'pdf'));
}
