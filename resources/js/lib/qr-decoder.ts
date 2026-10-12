import zxingWasm from 'zxing-wasm/reader/zxing_reader.wasm?url';

/** Reads the QR code in the camera's current frame, if there is one. */
export type QrDecoder = {
    read: (video: HTMLVideoElement) => Promise<string | null>;
};

/** The Shape Detection API's reader, where the browser has it. */
type NativeReader = {
    new (options: { formats: string[] }): {
        detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
    };
    getSupportedFormats: () => Promise<string[]>;
};

/** Wide enough for a Virtual ID held at arm's length, small enough to read fast. */
const MAX_WIDTH = 960;

let decoder: Promise<QrDecoder> | null = null;

/**
 * The browser's own QR reader where it has one (Chrome on Android, macOS
 * and ChromeOS). Elsewhere, as on Windows laptops, iPhones and Firefox,
 * zxing-cpp compiled to WebAssembly, loaded only then and from this site,
 * never a CDN. One reader serves the whole visit.
 */
export function qrDecoder(): Promise<QrDecoder> {
    decoder ??= createDecoder().catch((error: unknown) => {
        // Offline, say: the next start tries again.
        decoder = null;

        throw error;
    });

    return decoder;
}

async function createDecoder(): Promise<QrDecoder> {
    const Native = (globalThis as { BarcodeDetector?: NativeReader })
        .BarcodeDetector;
    const formats = Native
        ? await Native.getSupportedFormats().catch(() => [])
        : [];

    if (Native && formats.includes('qr_code')) {
        const detector = new Native({ formats: ['qr_code'] });

        return {
            read: async (video) =>
                (await detector.detect(video))[0]?.rawValue ?? null,
        };
    }

    const { prepareZXingModule, readBarcodes } =
        await import('zxing-wasm/reader');
    await prepareZXingModule({
        overrides: {
            locateFile: (path: string, prefix: string) =>
                path.endsWith('.wasm') ? zxingWasm : prefix + path,
        },
        fireImmediately: true,
    });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (!context) {
        throw new Error('There is no canvas to read the camera with.');
    }

    return {
        read: async (video) => {
            const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
            const width = Math.round(video.videoWidth * scale);
            const height = Math.round(video.videoHeight * scale);

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            context.drawImage(video, 0, 0, width, height);
            const [result] = await readBarcodes(
                context.getImageData(0, 0, width, height),
                { formats: ['QRCode'], tryHarder: true, maxNumberOfSymbols: 1 },
            );

            return result?.isValid ? result.text : null;
        },
    };
}
