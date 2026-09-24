import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { PostImage } from '@/types';

const layouts: Record<number, string> = {
    1: 'grid-cols-1 aspect-[16/10]',
    2: 'grid-cols-2 aspect-[2/1]',
    3: 'grid-cols-2 grid-rows-2 aspect-[16/10]',
    4: 'grid-cols-2 grid-rows-2 aspect-[16/10]',
};

/** Up to four photos in a fixed-ratio grid (no layout shift), with a viewer. */
export function PostImages({
    images,
    sharedBy,
}: {
    images: PostImage[];
    sharedBy: string;
}) {
    const [open, setOpen] = useState<number | null>(null);

    if (images.length === 0) {
        return null;
    }

    const count = Math.min(images.length, 4);
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
            <div
                className={cn(
                    'grid gap-1 overflow-hidden rounded-[10px] bg-muted',
                    layouts[count],
                )}
            >
                {images.slice(0, 4).map((image, index) => (
                    <button
                        key={image.id}
                        type="button"
                        onClick={() => setOpen(index)}
                        className={cn(
                            'group relative min-h-0 overflow-hidden outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:ring-inset',
                            count === 3 && index === 0 && 'row-span-2',
                        )}
                    >
                        <img
                            src={image.url}
                            alt={altFor(index)}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.015]"
                        />
                    </button>
                ))}
            </div>

            <Dialog
                open={open !== null}
                onOpenChange={(value) => !value && setOpen(null)}
            >
                <DialogContent
                    onKeyDown={handleKeyDown}
                    className="max-w-[min(96vw,72rem)] gap-0 border-none bg-transparent p-0 shadow-none sm:max-w-[min(96vw,72rem)] [&>button:last-child]:top-2 [&>button:last-child]:right-2 [&>button:last-child]:rounded-full [&>button:last-child]:bg-background [&>button:last-child]:p-1.5 [&>button:last-child]:opacity-100"
                >
                    <DialogTitle className="sr-only">
                        Photos shared by {sharedBy}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Use the left and right arrow keys to move between
                        photos.
                    </DialogDescription>
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
                </DialogContent>
            </Dialog>
        </>
    );
}
