/**
 * The Virtual ID drawn as a wallet card: ISO/IEC 7810 ID-1, the size of a
 * bank card (85.60 × 53.98 mm), upright. One painter for the screen, the
 * saved image and the PDF, so what is saved is what is shown. Every size is a
 * fraction of the card's width, so it scales as the printed card does.
 */

/** ID-1, upright: as wide as a bank card is tall. */
export const CARD_MM = { width: 53.98, height: 85.6 } as const;
export const CARD_RATIO = CARD_MM.height / CARD_MM.width;

export const CARD_CAPTION = 'Scan the QR code for attendance verification.';
export const CARD_LABEL = 'Participant ID';

/** The words on the card. */
export type CardText = {
    name: string;
    affiliation: string;
    code: string;
    /** Shown when there is no photo. */
    initials: string;
};

/** The pictures on the card: the official marks as they are, and the photo. */
export type CardImages = {
    seal: HTMLImageElement | null;
    pilipinas: HTMLImageElement | null;
    mark: HTMLImageElement | null;
    photo: HTMLImageElement | null;
};

/** The `paper` and `mark-*` tokens (app.css), the same in both themes. */
export type CardColors = {
    paper: string;
    ink: string;
    accent: string;
    tint: string;
    pink: string;
    blue: string;
};

export type CardFonts = { sans: string; mono: string };

/** A text's width in a canvas font, such as a 2D context's measureText. */
export type Measure = (text: string, font: string) => number;

export type TextBlock = {
    top: number;
    size: number;
    lineHeight: number;
    font: string;
    lines: string[];
};

export type CardLayout = {
    width: number;
    height: number;
    radius: number;
    pad: number;
    /** The flowing shapes: the top-left cluster's size, the foot wave's height. */
    corner: number;
    foot: number;
    logo: { top: number; height: number; gap: number };
    title: TextBlock;
    subtitle: TextBlock;
    photo: { cx: number; cy: number; r: number; ring: number; stroke: number };
    name: TextBlock;
    affiliation: TextBlock;
    /** The QR's square, quiet zone included. */
    qr: { x: number; y: number; size: number };
    code: TextBlock;
    label: TextBlock;
    caption: TextBlock;
};

// The shapes, in GAD purple and the ⚥ icon's blue and pink, drawn in their
// own boxes: the cluster in 150 × 150 at the top-left, the wave in 320 × 72
// along the foot, stretched to the card's width.
const CORNER: [keyof CardColors, string][] = [
    [
        'accent',
        'M0 0H146C128 14 106 18 90 32C70 50 74 80 54 102C40 118 20 124 0 134Z',
    ],
    ['blue', 'M0 0H104C92 16 76 22 62 36C48 50 44 72 26 84C18 90 8 92 0 94Z'],
    ['pink', 'M0 0H58C52 12 42 20 32 30C22 40 16 54 0 60Z'],
];
const FOOT: [keyof CardColors, string][] = [
    [
        'accent',
        'M0 72V58C40 52 80 62 124 54C176 44 212 22 252 16C282 12 304 4 320 0V72Z',
    ],
    [
        'blue',
        'M110 72C140 62 170 64 204 54C238 44 262 30 292 26C304 24 314 22 320 20V72Z',
    ],
    ['pink', 'M206 72C232 64 256 62 280 52C296 46 310 40 320 38V72Z'],
];

/**
 * The text at the first size that fits: on one line, or on two balanced
 * lines. Past the smallest size it wraps onto more lines, breaking a word
 * longer than the line only as a last resort. Never cut off.
 */
export function fitText(
    text: string,
    sizes: readonly number[],
    maxWidth: number,
    font: (size: number) => string,
    measure: Measure,
): { size: number; lines: string[] } {
    const words = text.trim().split(/\s+/u).filter(Boolean);
    const whole = words.join(' ');

    for (const size of sizes) {
        if (measure(whole, font(size)) <= maxWidth) {
            return { size, lines: [whole] };
        }

        const split = balancedSplit(words, font(size), measure);

        if (
            split &&
            split.every((line) => measure(line, font(size)) <= maxWidth)
        ) {
            return { size, lines: split };
        }
    }

    const size = sizes[sizes.length - 1];

    return { size, lines: wrap(words, maxWidth, font(size), measure) };
}

/** Two lines as even as the words allow. */
function balancedSplit(
    words: string[],
    font: string,
    measure: Measure,
): [string, string] | null {
    let best: [string, string] | null = null;
    let widest = Infinity;

    for (let index = 1; index < words.length; index++) {
        const lines: [string, string] = [
            words.slice(0, index).join(' '),
            words.slice(index).join(' '),
        ];
        const width = Math.max(...lines.map((line) => measure(line, font)));

        if (width < widest) {
            widest = width;
            best = lines;
        }
    }

    return best;
}

function wrap(
    words: string[],
    maxWidth: number,
    font: string,
    measure: Measure,
): string[] {
    const lines: string[] = [];
    let line = '';

    for (const word of words.flatMap((word) =>
        breakWord(word, maxWidth, font, measure),
    )) {
        const next = line ? `${line} ${word}` : word;

        if (line && measure(next, font) > maxWidth) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }

    return line ? [...lines, line] : lines;
}

/** A word wider than the line, in pieces that fit. */
function breakWord(
    word: string,
    maxWidth: number,
    font: string,
    measure: Measure,
): string[] {
    if (measure(word, font) <= maxWidth) {
        return [word];
    }

    const pieces: string[] = [];
    let piece = '';

    for (const character of Array.from(word)) {
        if (piece && measure(piece + character, font) > maxWidth) {
            pieces.push(piece);
            piece = character;
        } else {
            piece += character;
        }
    }

    return piece ? [...pieces, piece] : pieces;
}

/**
 * Where everything sits on a card `width` pixels wide. The header, photo,
 * name and place come down from the top; the QR, its code and the scan line
 * stand on the foot wave. A long name or place first shrinks the QR, never
 * below a size phones read easily, then the photo.
 */
export function layoutCard(
    text: Pick<CardText, 'name' | 'affiliation'>,
    width: number,
    fonts: CardFonts,
    measure: Measure,
): CardLayout {
    const w = width;
    const h = w * CARD_RATIO;
    const pad = 0.065 * w;
    const textWidth = w - 2 * pad;
    const sans = (weight: number) => (size: number) =>
        `${weight} ${size}px ${fonts.sans}`;
    const block = (
        top: number,
        size: number,
        lineHeight: number,
        font: string,
        lines: string[],
    ): TextBlock => ({ top, size, lineHeight, font, lines });
    const bottomOf = (text: TextBlock) =>
        text.top + text.lines.length * text.size * text.lineHeight;

    const logo = { top: 0.055 * w, height: 0.09 * w, gap: 0.022 * w };
    const title = block(
        logo.top + logo.height + 0.016 * w,
        0.046 * w,
        1.2,
        sans(600)(0.046 * w),
        ['PHLGADIS'],
    );
    const subtitle = block(
        bottomOf(title),
        0.0375 * w,
        1.2,
        sans(400)(0.0375 * w),
        ['Virtual ID'],
    );

    const name = fitText(
        text.name,
        [0.0625 * w, 0.056 * w, 0.05 * w],
        textWidth,
        sans(600),
        measure,
    );
    const affiliation = fitText(
        text.affiliation,
        [0.044 * w, 0.0375 * w],
        textWidth,
        sans(400),
        measure,
    );

    const foot = 0.1 * w;
    const captionSize = 0.0375 * w;
    const captionLines = fitText(
        CARD_CAPTION,
        [captionSize],
        textWidth,
        sans(400),
        measure,
    ).lines;
    const caption = block(
        h - foot - 0.025 * w - captionLines.length * captionSize * 1.25,
        captionSize,
        1.25,
        sans(400)(captionSize),
        captionLines,
    );
    const label = block(
        caption.top - 0.014 * w - 0.0375 * w * 1.2,
        0.0375 * w,
        1.2,
        sans(400)(0.0375 * w),
        [CARD_LABEL],
    );
    const code = block(
        label.top - 0.056 * w * 1.25,
        0.056 * w,
        1.25,
        `500 ${0.056 * w}px ${fonts.mono}`,
        [],
    );

    const ring = 0.022 * w;
    const nameLines = name.lines.length * name.size * 1.2;
    const affiliationLines = affiliation.lines.length * affiliation.size * 1.3;
    const textBottom = (photo: number) =>
        bottomOf(subtitle) +
        0.03 * w +
        photo +
        2 * ring +
        0.04 * w +
        nameLines +
        0.014 * w +
        affiliationLines;
    const qrTop = (size: number) => code.top - 0.012 * w - size;
    let photo = 0.24 * w;
    let qr = 0.46 * w;

    while (textBottom(photo) + 0.035 * w > qrTop(qr) && qr > 0.34 * w) {
        qr -= 0.01 * w;
    }

    while (textBottom(photo) + 0.035 * w > qrTop(qr) && photo > 0.2 * w) {
        photo -= 0.01 * w;
    }

    const cy = bottomOf(subtitle) + 0.03 * w + ring + photo / 2;
    const nameBlock = block(
        cy + photo / 2 + ring + 0.04 * w,
        name.size,
        1.2,
        sans(600)(name.size),
        name.lines,
    );

    return {
        width: w,
        height: h,
        radius: (3.18 / CARD_MM.width) * w,
        pad,
        corner: 0.42 * w,
        foot,
        logo,
        title,
        subtitle,
        photo: { cx: w / 2, cy, r: photo / 2, ring, stroke: 0.007 * w },
        name: nameBlock,
        affiliation: block(
            bottomOf(nameBlock) + 0.014 * w,
            affiliation.size,
            1.3,
            sans(400)(affiliation.size),
            affiliation.lines,
        ),
        qr: { x: (w - qr) / 2, y: qrTop(qr), size: qr },
        code,
        label,
        caption,
    };
}

/** Draws the card on a 2D context whose size is the layout's, in pixels. */
export function paintCard(
    context: CanvasRenderingContext2D,
    layout: CardLayout,
    text: CardText,
    images: CardImages,
    colors: CardColors,
    qr: string[],
): void {
    const { width: w, height: h, pad } = layout;
    context.clearRect(0, 0, w, h);
    context.save();
    roundedRect(context, 0, 0, w, h, layout.radius);
    context.clip();
    context.fillStyle = colors.paper;
    context.fillRect(0, 0, w, h);
    context.imageSmoothingQuality = 'high';

    shapes(
        context,
        CORNER,
        colors,
        0,
        0,
        layout.corner / 150,
        layout.corner / 150,
    );
    shapes(
        context,
        FOOT,
        colors,
        0,
        h - layout.foot,
        w / 320,
        layout.foot / 72,
    );

    // The official marks, right-aligned, as they are.
    let right = w - pad;

    for (const image of [images.mark, images.pilipinas, images.seal]) {
        if (!image) {
            continue;
        }

        const width =
            (image.naturalWidth / image.naturalHeight) * layout.logo.height;
        context.drawImage(
            image,
            right - width,
            layout.logo.top,
            width,
            layout.logo.height,
        );
        right -= width + layout.logo.gap;
    }

    writeLines(context, layout.title, colors.ink, 1, 'right', w - pad);
    writeLines(context, layout.subtitle, colors.ink, 0.7, 'right', w - pad);

    // The photo in a white gap and a purple ring, or the initials.
    const { cx, cy, r, ring, stroke } = layout.photo;
    context.beginPath();
    context.arc(cx, cy, r + ring - stroke / 2, 0, Math.PI * 2);
    context.strokeStyle = colors.accent;
    context.lineWidth = stroke;
    context.stroke();
    context.save();
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.clip();

    if (images.photo) {
        const side = Math.min(
            images.photo.naturalWidth,
            images.photo.naturalHeight,
        );
        context.drawImage(
            images.photo,
            (images.photo.naturalWidth - side) / 2,
            (images.photo.naturalHeight - side) / 2,
            side,
            side,
            cx - r,
            cy - r,
            2 * r,
            2 * r,
        );
    } else {
        context.fillStyle = colors.tint;
        context.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        context.fillStyle = colors.accent;
        context.font = layout.name.font.replace(/[\d.]+px/u, `${r * 0.62}px`);
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text.initials, cx, cy);
    }

    context.restore();

    writeLines(context, layout.name, colors.ink, 1, 'center', w / 2);
    writeLines(context, layout.affiliation, colors.ink, 0.7, 'center', w / 2);

    // The QR in whole pixels, so its squares stay sharp: black on white,
    // with the four-module quiet zone.
    const modules = qr.length + 8;
    const unit = Math.max(1, Math.floor(layout.qr.size / modules));
    const size = unit * modules;
    const x = Math.round(layout.qr.x + (layout.qr.size - size) / 2);
    const y = Math.round(layout.qr.y + (layout.qr.size - size) / 2);
    context.fillStyle = colors.paper;
    context.fillRect(x, y, size, size);
    context.beginPath();
    qr.forEach((row, rowIndex) => {
        Array.from(row).forEach((cell, column) => {
            if (cell === '1') {
                context.rect(
                    x + (4 + column) * unit,
                    y + (4 + rowIndex) * unit,
                    unit,
                    unit,
                );
            }
        });
    });
    context.fillStyle = colors.ink;
    context.fill();

    writeLines(
        context,
        { ...layout.code, lines: [text.code] },
        colors.ink,
        1,
        'center',
        w / 2,
    );
    writeLines(context, layout.label, colors.ink, 0.7, 'center', w / 2);
    writeLines(context, layout.caption, colors.ink, 0.7, 'center', w / 2);
    context.restore();

    // A hairline edge, as on screen, so a white card shows on white.
    context.save();
    roundedRect(context, 0.5, 0.5, w - 1, h - 1, layout.radius);
    context.strokeStyle = colors.ink;
    context.globalAlpha = 0.12;
    context.lineWidth = Math.max(1, w * 0.002);
    context.stroke();
    context.restore();
}

function shapes(
    context: CanvasRenderingContext2D,
    paths: [keyof CardColors, string][],
    colors: CardColors,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
): void {
    context.save();
    context.translate(x, y);
    context.scale(scaleX, scaleY);

    for (const [color, path] of paths) {
        context.fillStyle = colors[color];
        context.fill(new Path2D(path));
    }

    context.restore();
}

function writeLines(
    context: CanvasRenderingContext2D,
    text: TextBlock,
    color: string,
    alpha: number,
    align: CanvasTextAlign,
    x: number,
): void {
    context.save();
    context.font = text.font;
    context.fillStyle = color;
    context.globalAlpha = alpha;
    context.textAlign = align;
    context.textBaseline = 'top';
    text.lines.forEach((line, index) => {
        context.fillText(
            line,
            x,
            text.top + index * text.size * text.lineHeight,
        );
    });
    context.restore();
}

function roundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
}
