/** A post's photos keep up to this many pixels on their longest side. */
const LONGEST_SIDE = 2048;
/** Photos this light already upload quickly, so they go as they are. */
const LIGHT_ENOUGH = 1024 * 1024;

/**
 * A photo made light enough to post from a phone: no more than 2048 px on
 * its longest side, as a JPEG, upright, and without its Exif details (which
 * can say where it was taken). A 4 MB phone photo becomes about 0.5 MB.
 * Light photos, and any the browser cannot read, are returned unchanged.
 */
export async function shrinkPhoto(file: File): Promise<File> {
    if (file.size <= LIGHT_ENOUGH) {
        return file;
    }

    const url = URL.createObjectURL(file);
    const canvas = document.createElement('canvas');

    try {
        const image = await load(url);
        const scale = Math.min(
            1,
            LONGEST_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
        );
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');

        if (!context) {
            return file;
        }

        // JPEG has no transparency: see-through parts of a PNG turn white,
        // not black.
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', 0.85),
        );

        if (!blob || blob.size >= file.size) {
            return file;
        }

        return new File([blob], `${file.name.replace(/\.[^.]*$/, '')}.jpg`, {
            type: 'image/jpeg',
            lastModified: file.lastModified,
        });
    } catch {
        return file;
    } finally {
        URL.revokeObjectURL(url);
        // iOS Safari holds a canvas's memory until it is emptied.
        canvas.width = 0;
        canvas.height = 0;
    }
}

function load(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Could not read the photo.'));
        image.src = url;
    });
}
