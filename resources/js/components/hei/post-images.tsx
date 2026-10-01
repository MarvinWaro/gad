import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ImgHTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { PhotoLightboxContent } from '@/components/photo-lightbox';
import { Dialog } from '@/components/ui/dialog';
import { singlePhotoHeight } from '@/lib/photo-frame';
import { cn } from '@/lib/utils';
import type { PostImage } from '@/types';

const layouts: Record<number, string> = {
    // One photo keeps its own shape (singlePhotoHeight).
    1: 'grid-cols-1',
    2: 'grid-cols-2 aspect-[2/1]',
    3: 'grid-cols-2 grid-rows-2 aspect-[16/10]',
    4: 'grid-cols-2 grid-rows-2 aspect-[16/10]',
    // Five or more: two photos over three, the last showing "+N".
    5: 'grid-cols-6 grid-rows-2 aspect-[4/3]',
};

/** Tiles shown before the rest collapse into the "+N" tile. */
const MOSAIC_TILES = 5;

export type MosaicImage = {
    key: string | number;
    url: string;
    alt: string;
    /** As shown. When unknown, a lone photo is measured once it loads. */
    width?: number | null;
    height?: number | null;
};

type PhotoSize = { width: number; height: number };

/**
 * A mosaic photo that shimmers in its tile until it arrives, which on a slow
 * connection is most of what the reader waits for. The shimmer goes once the
 * photo loads (or fails), so a lone photo's bands never pulse.
 */
function TilePhoto({
    onLoad,
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    const [loaded, setLoaded] = useState(false);

    return (
        <>
            {!loaded && (
                <span
                    aria-hidden
                    className="absolute inset-0 animate-pulse bg-primary/10 motion-reduce:animate-none"
                />
            )}
            <img
                {...props}
                onLoad={(event) => {
                    setLoaded(true);
                    onLoad?.(event);
                }}
                onError={() => setLoaded(true)}
                className={cn('relative', className)}
            />
        </>
    );
}

/**
 * Photos in a frame whose shape is known before they load, so the feed
 * never jumps. A lone photo keeps its own shape and shows whole; two to four
 * fill fixed-ratio grids; five or more show two over three, and the fifth
 * tile counts the rest. Grid tiles are cropped, and the viewer shows each
 * photo whole. Shared by the feed and the composer preview.
 *
 * `overlay` (a post's goal badges) sits once in the bottom-right corner of
 * the whole frame, over a soft fade. The frame sits in a size container, so
 * its height and the overlay scale with its width (cqw).
 */
export function PhotoMosaic({
    images,
    onSelect,
    overlay,
}: {
    images: MosaicImage[];
    onSelect?: (index: number) => void;
    overlay?: ReactNode;
}) {
    // The size of a lone photo that came without one (a composer preview).
    const [measured, setMeasured] = useState<
        (PhotoSize & { url: string }) | null
    >(null);

    if (images.length === 0) {
        return null;
    }

    const shown = images.slice(0, MOSAIC_TILES);
    const hidden = images.length - shown.length;
    const layout = layouts[Math.min(images.length, MOSAIC_TILES)];
    const single = images.length === 1 ? images[0] : null;
    const singleSize: PhotoSize | null =
        single?.width && single.height
            ? { width: single.width, height: single.height }
            : measured && measured.url === single?.url
              ? measured
              : null;

    return (
        <div className="@container">
            <div
                className={cn(
                    'relative grid gap-1 overflow-hidden rounded-[10px] bg-muted',
                    layout,
                )}
                style={
                    single
                        ? {
                              height: singlePhotoHeight(
                                  singleSize?.width,
                                  singleSize?.height,
                              ),
                          }
                        : undefined
                }
            >
                {shown.map((image, index) => {
                    const isLast = index === shown.length - 1 && hidden > 0;
                    const tileClass = cn(
                        'group relative min-h-0 overflow-hidden',
                        images.length === 3 && index === 0 && 'row-span-2',
                        images.length >= MOSAIC_TILES &&
                            (index < 2 ? 'col-span-3' : 'col-span-2'),
                    );
                    const content = (
                        <>
                            <TilePhoto
                                key={image.url}
                                src={image.url}
                                alt={image.alt}
                                loading="lazy"
                                decoding="async"
                                onLoad={
                                    single && !singleSize
                                        ? (event) =>
                                              setMeasured({
                                                  url: image.url,
                                                  width: event.currentTarget
                                                      .naturalWidth,
                                                  height: event.currentTarget
                                                      .naturalHeight,
                                              })
                                        : undefined
                                }
                                className={cn(
                                    'size-full transition-transform duration-200 ease-out group-hover:scale-[1.015]',
                                    single ? 'object-contain' : 'object-cover',
                                )}
                            />
                            {isLast && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-medium text-white tabular-nums">
                                    +{hidden}
                                    <span className="sr-only">
                                        {' '}
                                        more {hidden === 1 ? 'photo' : 'photos'}
                                    </span>
                                </span>
                            )}
                        </>
                    );

                    return onSelect ? (
                        <button
                            key={image.key}
                            type="button"
                            onClick={() => onSelect(index)}
                            className={cn(
                                tileClass,
                                'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset',
                            )}
                        >
                            {content}
                        </button>
                    ) : (
                        <div key={image.key} className={tileClass}>
                            {content}
                        </div>
                    );
                })}
                {overlay && (
                    // The fade lets clicks through to the photos; only the
                    // overlay itself takes them.
                    <div className="pointer-events-none absolute right-0 bottom-0 bg-corner-fade pt-[6cqw] pr-[max(8px,2.5cqw)] pb-[max(8px,2.5cqw)] pl-[12cqw]">
                        <div className="pointer-events-auto">{overlay}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * A post's photos as a mosaic, opening a viewer that steps through all. The
 * viewer shows each photo on its own, without the mosaic's overlay.
 */
export function PostImages({
    images,
    sharedBy,
    overlay,
}: {
    images: PostImage[];
    sharedBy: string;
    overlay?: ReactNode;
}) {
    const [open, setOpen] = useState<number | null>(null);

    if (images.length === 0) {
        return null;
    }

    const altFor = (index: number) =>
        `Photo ${index + 1} of ${images.length} shared by ${sharedBy}`;

    function step(offset: number) {
        setOpen((current) =>
            current === null
                ? current
                : (current + offset + images.length) % images.length,
        );
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'ArrowRight') {
            step(1);
        } else if (event.key === 'ArrowLeft') {
            step(-1);
        }
    }

    return (
        <>
            <PhotoMosaic
                images={images.map((image, index) => ({
                    key: image.id,
                    url: image.url,
                    alt: altFor(index),
                    width: image.width,
                    height: image.height,
                }))}
                onSelect={setOpen}
                overlay={overlay}
            />

            <Dialog
                open={open !== null}
                onOpenChange={(value) => !value && setOpen(null)}
            >
                <PhotoLightboxContent
                    onKeyDown={handleKeyDown}
                    title={`Photos shared by ${sharedBy}`}
                    description="Use the left and right arrow keys to move between photos."
                >
                    {open !== null && images[open] && (
                        <figure className="flex flex-col items-center">
                            <img
                                src={images[open].url}
                                alt={altFor(open)}
                                className="max-h-[82vh] w-auto rounded-[10px] object-contain"
                            />
                            {images.length > 1 && (
                                <figcaption className="mt-3 flex items-center gap-3 rounded-[10px] bg-background px-2 py-1 text-sm tabular-nums">
                                    <button
                                        type="button"
                                        onClick={() => step(-1)}
                                        className="flex size-8 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <ChevronLeft
                                            aria-hidden
                                            className="size-4"
                                        />
                                        <span className="sr-only">
                                            Previous photo
                                        </span>
                                    </button>
                                    {open + 1} / {images.length}
                                    <button
                                        type="button"
                                        onClick={() => step(1)}
                                        className="flex size-8 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <ChevronRight
                                            aria-hidden
                                            className="size-4"
                                        />
                                        <span className="sr-only">
                                            Next photo
                                        </span>
                                    </button>
                                </figcaption>
                            )}
                        </figure>
                    )}
                </PhotoLightboxContent>
            </Dialog>
        </>
    );
}
