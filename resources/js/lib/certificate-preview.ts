import type { CertificateDocument } from '../types/certificates';

/** Typing in the wording pauses this long before the page is drawn again. */
export const TYPING_DELAY_MS = 400;

/** The widest the preview is drawn, in device pixels. */
export const MAX_DRAW_WIDTH = 1400;

/**
 * How long the editor's preview waits before drawing a change: a pick (a
 * background, kind, office, logo or signatory) is drawn at once; typing in
 * the wording waits for a pause, so each key doesn't start a page.
 */
export function redrawDelay(
    previous: CertificateDocument | null,
    next: CertificateDocument,
): number {
    if (previous === null || previous.body === next.body) {
        return 0;
    }

    const rest = (document: CertificateDocument) =>
        JSON.stringify({ ...document, body: '' });

    return rest(previous) === rest(next) ? TYPING_DELAY_MS : 0;
}

/**
 * The page's width in device pixels: as wide as it shows, sharp on
 * high-density screens, never more than MAX_DRAW_WIDTH. Fewer pixels draw
 * faster.
 */
export function drawWidth(shownWidth: number, pixelRatio: number): number {
    if (shownWidth <= 0) {
        return MAX_DRAW_WIDTH;
    }

    return Math.min(MAX_DRAW_WIDTH, Math.ceil(shownWidth * pixelRatio));
}
