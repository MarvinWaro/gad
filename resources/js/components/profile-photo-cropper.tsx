import { useForm } from '@inertiajs/react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode, SyntheticEvent } from 'react';
import ReactCrop, {
    centerCrop,
    convertToPixelCrop,
    makeAspectCrop,
} from 'react-image-crop';
import type { PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import ProfileAvatarController from '@/actions/App/Http/Controllers/Settings/ProfileAvatarController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
// The source can be a large phone photo: only the cropped square is sent.
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
// The uploaded square: sharp on any avatar, small on the wire.
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Draws the chosen circle (a square crop) at up to 512px. The crop is in
 * the image's on-screen box and the image may be zoomed around its centre,
 * so both are mapped back to the photo's own pixels first.
 */
function renderCrop(
    image: HTMLImageElement,
    crop: PercentCrop,
    zoom: number,
): Promise<Blob> {
    const box = convertToPixelCrop(crop, image.width, image.height);
    const ratioX = image.naturalWidth / image.width;
    const ratioY = image.naturalHeight / image.height;
    const centerX = image.width / 2;
    const centerY = image.height / 2;
    const sourceX = ((box.x - centerX) / zoom + centerX) * ratioX;
    const sourceY = ((box.y - centerY) / zoom + centerY) * ratioY;
    const sourceWidth = (box.width / zoom) * ratioX;
    const sourceHeight = (box.height / zoom) * ratioY;
    const size = Math.round(Math.min(OUTPUT_SIZE, Math.max(64, sourceWidth)));

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (!context) {
        return Promise.reject(new Error('Canvas is not available.'));
    }

    context.imageSmoothingQuality = 'high';
    context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        size,
        size,
    );

    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) =>
                blob ? resolve(blob) : reject(new Error('Could not crop.')),
            // WebP keeps logo transparency; browsers without it return PNG.
            'image/webp',
            0.9,
        ),
    );
}

/**
 * Choosing a new profile photo: `pick()` opens the file picker, and the
 * returned `picker` (the hidden input and the crop dialog) must be rendered.
 * The cropped square uploads on Apply, and the page reloads with the new
 * photo wherever it was changed. Settings → Profile and My Profile share it.
 */
export function useProfilePhotoPicker(): {
    pick: () => void;
    picker: ReactNode;
    /** A problem to show beside the trigger while the dialog is closed. */
    error: string | undefined;
} {
    const input = useRef<HTMLInputElement>(null);
    const image = useRef<HTMLImageElement>(null);
    const [source, setSource] = useState<string | null>(null);
    const [crop, setCrop] = useState<PercentCrop>();
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [error, setError] = useState<string | null>(null);
    const form = useForm<{ avatar: File | null }>({ avatar: null });

    // Release the chosen photo's preview when it changes or on unmount.
    useEffect(
        () => () => {
            if (source) {
                URL.revokeObjectURL(source);
            }
        },
        [source],
    );

    function choose(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!ACCEPTED.includes(file.type)) {
            setError('Photos must be JPG, PNG, or WebP.');

            return;
        }

        if (file.size > MAX_SOURCE_BYTES) {
            setError('Choose a photo 15 MB or smaller.');

            return;
        }

        setError(null);
        form.clearErrors();
        setCrop(undefined);
        setZoom(MIN_ZOOM);
        setSource(URL.createObjectURL(file));
    }

    function frame(event: SyntheticEvent<HTMLImageElement>) {
        const { width, height } = event.currentTarget;
        setCrop(
            centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
                width,
                height,
            ),
        );
    }

    function closeCropper() {
        setSource(null);
        setCrop(undefined);
    }

    async function apply() {
        if (!image.current || !crop) {
            return;
        }

        let blob: Blob;

        try {
            blob = await renderCrop(image.current, crop, zoom);
        } catch {
            setError('That photo could not be cropped. Try another one.');

            return;
        }

        const extension = blob.type === 'image/webp' ? 'webp' : 'png';
        const file = new File([blob], `profile-photo.${extension}`, {
            type: blob.type,
        });

        form.transform(() => ({ avatar: file }));
        form.post(ProfileAvatarController.update.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeCropper,
        });
    }

    const message = error ?? form.errors.avatar;

    return {
        pick: () => input.current?.click(),
        error: source ? undefined : message,
        picker: (
            <>
                <input
                    ref={input}
                    type="file"
                    accept={ACCEPTED.join(',')}
                    onChange={choose}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                />
                <Dialog
                    open={source !== null}
                    onOpenChange={(open) => !open && closeCropper()}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Crop profile photo</DialogTitle>
                            <DialogDescription>
                                Drag the circle to reposition it. Use the slider
                                to zoom in or out.
                            </DialogDescription>
                        </DialogHeader>

                        {source && (
                            <div className="flex justify-center overflow-hidden rounded-[10px] bg-muted">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percent) => setCrop(percent)}
                                    aspect={1}
                                    circularCrop
                                    keepSelection
                                    minWidth={48}
                                >
                                    <img
                                        ref={image}
                                        src={source}
                                        alt="Your chosen photo"
                                        onLoad={frame}
                                        style={{ transform: `scale(${zoom})` }}
                                        className="max-h-[55dvh] w-auto"
                                    />
                                </ReactCrop>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setZoom((value) =>
                                        Math.max(MIN_ZOOM, value - 0.25),
                                    )
                                }
                                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <ZoomOut aria-hidden className="size-4" />
                                <span className="sr-only">Zoom out</span>
                            </button>
                            <input
                                type="range"
                                min={MIN_ZOOM}
                                max={MAX_ZOOM}
                                step={0.01}
                                value={zoom}
                                onChange={(event) =>
                                    setZoom(Number(event.target.value))
                                }
                                aria-label="Zoom"
                                className="h-1.5 flex-1 cursor-pointer accent-primary"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setZoom((value) =>
                                        Math.min(MAX_ZOOM, value + 0.25),
                                    )
                                }
                                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <ZoomIn aria-hidden className="size-4" />
                                <span className="sr-only">Zoom in</span>
                            </button>
                        </div>

                        <InputError message={message} />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeCropper}
                                disabled={form.processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void apply()}
                                disabled={!crop || form.processing}
                            >
                                {form.processing && <Spinner />}
                                {form.processing ? 'Saving…' : 'Apply'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        ),
    };
}
