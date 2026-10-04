/**
 * A picture shrunk into a square of `size` pixels, whole and centred, with
 * its transparency kept, as WebP (PNG where a browser cannot write WebP).
 * Badge pictures go up this small: a 1 MB PNG from an image generator
 * becomes about 10–20 KB.
 */
export async function squareImage(file: File, size = 256): Promise<File> {
    const url = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = url;
        await image.decode();

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Canvas is not available.');
        }

        const scale = Math.min(
            size / image.naturalWidth,
            size / image.naturalHeight,
        );
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        context.imageSmoothingQuality = 'high';
        context.drawImage(
            image,
            (size - width) / 2,
            (size - height) / 2,
            width,
            height,
        );

        const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
                (result) =>
                    result
                        ? resolve(result)
                        : reject(new Error('Could not shrink the picture.')),
                'image/webp',
                0.9,
            ),
        );
        const extension = blob.type === 'image/webp' ? 'webp' : 'png';

        return new File([blob], `badge.${extension}`, { type: blob.type });
    } finally {
        URL.revokeObjectURL(url);
    }
}
