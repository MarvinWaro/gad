/** A lone photo wider than 2:1 gets bands above and below instead. */
export const WIDEST_PHOTO = 2;

/** The frame's shape until a photo's size is known. */
export const DEFAULT_PHOTO_RATIO = 16 / 10;

/**
 * The height of the frame for a post's only photo, as CSS. The frame takes
 * the photo's own shape across its full width (100cqw), no wider than 2:1,
 * and no taller than 80% of the screen or 44rem. The photo is contained, so
 * a very tall or very wide photo shows whole with bands, never cropped.
 */
export function singlePhotoHeight(
    width?: number | null,
    height?: number | null,
): string {
    const ratio =
        width && height
            ? Math.min(width / height, WIDEST_PHOTO)
            : DEFAULT_PHOTO_RATIO;

    return `min(${(100 / ratio).toFixed(2)}cqw, 80svh, 44rem)`;
}
