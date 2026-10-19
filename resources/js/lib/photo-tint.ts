/**
 * The colour along the foot of a photo, for the band behind a post's goal
 * badges, so each band matches its picture (like a partner office's own
 * branded edge) without blurring or covering the photo.
 */

/** The strip of the photo that is sampled: its lowest fifth. */
const STRIP = 0.2;

/**
 * The average of RGBA pixels, leaving out see-through ones (a PNG's empty
 * corners). Null when every pixel is see-through.
 */
export function averageRgb(
    pixels: ArrayLike<number>,
): [number, number, number] | null {
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for (let index = 0; index + 3 < pixels.length; index += 4) {
        if (pixels[index + 3] < 128) {
            continue;
        }

        red += pixels[index];
        green += pixels[index + 1];
        blue += pixels[index + 2];
        count += 1;
    }

    return count === 0
        ? null
        : [
              Math.round(red / count),
              Math.round(green / count),
              Math.round(blue / count),
          ];
}

/**
 * The band's colour from a photo's average: the same hue, richer and deep
 * enough to read as a glow and to set the badges off (lightness 22–42%).
 */
export function bandColor([red, green, blue]: [
    number,
    number,
    number,
]): string {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const chroma = max - min;
    const saturation =
        chroma === 0 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1));
    const hue =
        chroma === 0
            ? 0
            : max === r
              ? 60 * (((g - b) / chroma + 6) % 6)
              : max === g
                ? 60 * ((b - r) / chroma + 2)
                : 60 * ((r - g) / chroma + 4);
    // A grey or black photo keeps a neutral band, never a tinted one.
    const richer = saturation < 0.08 ? 0 : Math.min(1, saturation * 1.4 + 0.1);
    const deep = Math.min(0.42, Math.max(0.22, lightness));

    return `hsl(${Math.round(hue)} ${Math.round(richer * 100)}% ${Math.round(deep * 100)}%)`;
}

/**
 * The band colour for a loaded photo, from its lowest strip.
 * Null when it cannot be read, such as a photo from another address that
 * does not allow it.
 */
export function bottomTint(image: HTMLImageElement): string | null {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 6;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const strip = Math.max(1, Math.round(image.naturalHeight * STRIP));

    if (!context || image.naturalWidth === 0) {
        return null;
    }

    try {
        context.drawImage(
            image,
            0,
            image.naturalHeight - strip,
            image.naturalWidth,
            strip,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        const rgb = averageRgb(
            context.getImageData(0, 0, canvas.width, canvas.height).data,
        );

        return rgb ? bandColor(rgb) : null;
    } catch {
        return null;
    }
}
