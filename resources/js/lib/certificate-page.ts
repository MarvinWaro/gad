/**
 * A certificate's page: A4 landscape, where things sit on it, and the fixed
 * backgrounds (`CertificateDesign::BACKGROUNDS`), drawn as SVG in points so
 * the PDF prints them as vectors and the editor shows the very same drawing
 * as its thumbnails. The backgrounds use the `paper` tokens, the same in
 * both themes, and keep the middle and the signatories' row plain, where the
 * words and e-signatures go. Pure but for paperColors(), so it can be tested
 * without a browser.
 */

/** A4 landscape, in points. */
export const PAGE = { width: 841.89, height: 595.28 } as const;

/**
 * Where things sit on the page, in points. The signatories' row and the
 * verify block are fixed, so every certificate lines them up the same way,
 * whatever its wording.
 */
export const MARGIN = { x: 60, y: 34 } as const;
export const CONTENT_WIDTH = PAGE.width - 2 * MARGIN.x;
export const LAYOUT = {
    logo: 46,
    nameRule: 440,
    signatoriesTop: 428,
    signature: { width: 150, height: 46 },
    signatoryWidth: 190,
    signatoryGap: 24,
    qr: 50,
    qrTop: 516,
} as const;

/** The name on one line: smaller as it grows, never below a readable size. */
export function nameSize(name: string): number {
    // TeX Gyre Bonum Bold capitals run about 0.72 of their size wide.
    const fitted = (CONTENT_WIDTH - 40) / (Math.max(name.length, 1) * 0.72);

    return Math.round(Math.min(32, Math.max(18, fitted)) * 2) / 2;
}

/** Long wording a little smaller, so it ends above the signatories. */
export function bodySize(body: string): number {
    return body.length > 300 ? 11.5 : body.length > 180 ? 12.5 : 13.5;
}

/** Where the row of 1, 2 or 3 signatories starts, centred on the page. */
export function signatoryRowLeft(count: number): number {
    const width =
        count * LAYOUT.signatoryWidth +
        Math.max(count - 1, 0) * LAYOUT.signatoryGap;

    return (PAGE.width - width) / 2;
}

/** A picture's size fitted in a box, keeping its shape. */
export function fit(
    size: { width: number; height: number },
    width: number,
    height: number,
): { width: number; height: number } {
    const scale = Math.min(width / size.width, height / size.height);

    return { width: size.width * scale, height: size.height * scale };
}

/** The `paper` tokens (app.css). */
export type CertificateColors = {
    paper: string;
    ink: string;
    accent: string;
    tint: string;
};

export const CERTIFICATE_BACKGROUNDS = ['frame', 'flow', 'band'] as const;

export type CertificateBackground = (typeof CERTIFICATE_BACKGROUNDS)[number];

export const backgroundLabels: Record<CertificateBackground, string> = {
    frame: 'Classic frame',
    flow: 'Flow',
    band: 'Side band',
};

/** The `paper` tokens as the page has them, the same in both themes. */
export function paperColors(): CertificateColors {
    const style = getComputedStyle(document.documentElement);
    const token = (name: string) => style.getPropertyValue(`--${name}`).trim();

    return {
        paper: token('paper'),
        ink: token('paper-foreground'),
        accent: token('paper-accent'),
        tint: token('paper-tint'),
    };
}

/** One of the three, or the classic frame for anything else. */
export function backgroundOf(
    value: string | null | undefined,
): CertificateBackground {
    return CERTIFICATE_BACKGROUNDS.find((known) => known === value) ?? 'frame';
}

function svg(colors: CertificateColors, shapes: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.width}" height="${PAGE.height}" viewBox="0 0 ${PAGE.width} ${PAGE.height}"><rect width="${PAGE.width}" height="${PAGE.height}" fill="${colors.paper}"/>${shapes}</svg>`;
}

/** A double rule, with a tinted quarter-circle and a diamond at each corner. */
function frame(colors: CertificateColors): string {
    const { width, height } = PAGE;
    const outer = 16;
    const inner = 24;
    const fan = 46;
    const corners = [
        [inner, inner, 1, 1],
        [width - inner, inner, -1, 1],
        [inner, height - inner, 1, -1],
        [width - inner, height - inner, -1, -1],
    ] as const;
    const diamonds = [
        [20, 20],
        [width - 20, 20],
        [20, height - 20],
        [width - 20, height - 20],
    ] as const;

    return svg(
        colors,
        [
            ...corners.map(
                ([x, y, dx, dy]) =>
                    `<path d="M${x} ${y}h${dx * fan}A${fan} ${fan} 0 0 ${dx * dy > 0 ? 1 : 0} ${x} ${y + dy * fan}Z" fill="${colors.tint}"/>`,
            ),
            `<rect x="${outer}" y="${outer}" width="${width - 2 * outer}" height="${height - 2 * outer}" fill="none" stroke="${colors.accent}" stroke-width="3"/>`,
            `<rect x="${inner}" y="${inner}" width="${width - 2 * inner}" height="${height - 2 * inner}" fill="none" stroke="${colors.accent}" stroke-width="0.8"/>`,
            ...diamonds.map(
                ([x, y]) =>
                    `<path d="M${x} ${y - 6}L${x + 6} ${y}L${x} ${y + 6}L${x - 6} ${y}Z" fill="${colors.accent}"/>`,
            ),
        ].join(''),
    );
}

/**
 * The Virtual ID's flowing shapes in GAD purple: a cluster at the top-left
 * corner and a low wave along the foot, below the signatories.
 */
function flow(colors: CertificateColors): string {
    const { width, height } = PAGE;
    const corner = 1.3;
    const foot = { x: width / 320, y: 30 / 72 };
    const layers = [
        [colors.accent, 1],
        [colors.tint, 1],
        [colors.accent, 0.55],
    ] as const;
    const cornerPaths = [
        'M0 0H146C128 14 106 18 90 32C70 50 74 80 54 102C40 118 20 124 0 134Z',
        'M0 0H104C92 16 76 22 62 36C48 50 44 72 26 84C18 90 8 92 0 94Z',
        'M0 0H58C52 12 42 20 32 30C22 40 16 54 0 60Z',
    ];
    const footPaths = [
        'M0 72V58C40 52 80 62 124 54C176 44 212 22 252 16C282 12 304 4 320 0V72Z',
        'M110 72C140 62 170 64 204 54C238 44 262 30 292 26C304 24 314 22 320 20V72Z',
        'M206 72C232 64 256 62 280 52C296 46 310 40 320 38V72Z',
    ];

    return svg(
        colors,
        [
            ...cornerPaths.map(
                (path, index) =>
                    `<path transform="scale(${corner})" d="${path}" fill="${layers[index][0]}" fill-opacity="${layers[index][1]}"/>`,
            ),
            ...footPaths.map(
                (path, index) =>
                    `<path transform="translate(0 ${height - 30}) scale(${foot.x} ${foot.y})" d="${path}" fill="${layers[index][0]}" fill-opacity="${layers[index][1]}"/>`,
            ),
        ].join(''),
    );
}

/** A purple band down the left edge, with a tinted strip and a fine rule. */
function band(colors: CertificateColors): string {
    const { width, height } = PAGE;

    return svg(
        colors,
        [
            `<rect width="28" height="${height}" fill="${colors.accent}"/>`,
            `<rect x="28" width="12" height="${height}" fill="${colors.tint}"/>`,
            `<rect x="46" width="1" height="${height}" fill="${colors.accent}"/>`,
            `<rect x="${width - 12}" width="12" height="${height}" fill="${colors.tint}"/>`,
        ].join(''),
    );
}

const painters: Record<
    CertificateBackground,
    (colors: CertificateColors) => string
> = {
    frame,
    flow,
    band,
};

/** The background's SVG, page-sized. */
export function backgroundSvg(
    background: string | null | undefined,
    colors: CertificateColors,
): string {
    return painters[backgroundOf(background)](colors);
}
