import { FileDown, ImageDown, Maximize2, Repeat2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { VirtualIdLanyard } from '@/components/virtual-id-lanyard';
import { useInitials } from '@/hooks/use-initials';
import { toast } from '@/lib/toast';
import { CARD_MM } from '@/lib/virtual-id';
import type { CardImages, CardText } from '@/lib/virtual-id';
import {
    downloadCardImage,
    downloadCardPdf,
    loadCardImages,
    renderCard,
    renderCardBack,
} from '@/lib/virtual-id-render';
import { cn } from '@/lib/utils';

/** `VirtualIdResource`: someone's own Virtual ID. */
export type VirtualId = {
    name: string;
    /** Their institution, or their CHED office. */
    affiliation: string;
    /** The profile photo, from this site so the card can be saved. */
    photo: string | null;
    /** The participant code, such as "GAD-7K2M-Q9XA". */
    code: string;
    /** The code's QR modules, a string of 0s and 1s per row. */
    qr: string[];
};

/** A bank card's shape and its 3.18 mm corners, as the canvas draws them. */
const cardShape: CSSProperties = {
    aspectRatio: `${CARD_MM.width} / ${CARD_MM.height}`,
    borderRadius: `${(318 / CARD_MM.width).toFixed(2)}% / ${(318 / CARD_MM.height).toFixed(2)}%`,
};

/**
 * A face of the card on a canvas, redrawn at the screen's own pixel density
 * whenever its width changes.
 */
function CardCanvas({
    paint,
    label,
    className,
    children,
}: {
    /** Draws the face `width` pixels wide; null until the pictures load. */
    paint: ((canvas: HTMLCanvasElement, width: number) => Promise<void>) | null;
    /** The face's words for screen readers; none for a decorative face. */
    label?: string;
    className?: string;
    children?: ReactNode;
}) {
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const element = canvas.current;

        if (!element || !paint) {
            return;
        }

        const draw = () =>
            void paint(
                element,
                element.clientWidth * (window.devicePixelRatio || 1),
            );
        const observer = new ResizeObserver(draw);
        observer.observe(element);

        return () => observer.disconnect();
    }, [paint]);

    return (
        <canvas
            ref={canvas}
            role={label ? 'img' : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
            className={cn('block w-full', className)}
            style={cardShape}
        >
            {children}
        </canvas>
    );
}

/**
 * The Virtual ID: the card, the size of a bank card held upright, hanging
 * from a lanyard to swing and turn over, with a full view to show staff at
 * the registration table, and saves as an image or a PDF to print. One
 * painter draws the screen, the image and the PDF (lib/virtual-id.ts), so
 * what is saved is what is shown.
 */
export function VirtualIdCard({ card }: { card: VirtualId }) {
    const getInitials = useInitials();
    const [images, setImages] = useState<CardImages | null>(null);
    const [saving, setSaving] = useState<'image' | 'pdf' | null>(null);
    const [flipped, setFlipped] = useState(false);
    const text = useMemo<CardText>(
        () => ({
            name: card.name,
            affiliation: card.affiliation,
            code: card.code,
            initials: getInitials(card.name),
        }),
        [card.name, card.affiliation, card.code, getInitials],
    );
    const label = `Virtual ID of ${card.name}, ${card.affiliation}. Participant ID ${card.code}.`;
    const front = useMemo(
        () =>
            images
                ? (canvas: HTMLCanvasElement, width: number) =>
                      renderCard(canvas, width, text, images, card.qr)
                : null,
        [images, text, card.qr],
    );
    const back = useMemo(
        () =>
            images
                ? (canvas: HTMLCanvasElement, width: number) =>
                      renderCardBack(canvas, width, card.name, images)
                : null,
        [images, card.name],
    );

    useEffect(() => {
        let current = true;
        void loadCardImages(card.photo).then(
            (loaded) => current && setImages(loaded),
        );

        return () => {
            current = false;
        };
    }, [card.photo]);

    async function download(kind: 'image' | 'pdf') {
        if (!images) {
            return;
        }

        setSaving(kind);

        try {
            await (kind === 'image' ? downloadCardImage : downloadCardPdf)(
                text,
                images,
                card.qr,
            );
        } catch {
            toast.error('The Virtual ID could not be saved. Try again.');
        } finally {
            setSaving(null);
        }
    }

    return (
        <div className="space-y-4">
            <VirtualIdLanyard
                flipped={flipped}
                onTap={() => setFlipped((turned) => !turned)}
                front={
                    <CardCanvas
                        paint={front}
                        label={label}
                        className="shadow-lg"
                    >
                        {`${card.name}, ${card.affiliation}. Participant ID ${card.code}.`}
                    </CardCanvas>
                }
                back={<CardCanvas paint={back} className="shadow-lg" />}
            />
            <p className="text-[13px] text-muted-foreground">
                Drag the card to swing it, or tap it to turn it over. At the
                registration table, open the full view: it keeps your screen on
                and the QR still.
            </p>
            <div className="flex flex-wrap gap-2">
                <FullView paint={front} label={label} name={card.name}>
                    <Button type="button" disabled={!images}>
                        <Maximize2 />
                        View full ID
                    </Button>
                </FullView>
                <Button
                    type="button"
                    variant="outline"
                    aria-pressed={flipped}
                    onClick={() => setFlipped((turned) => !turned)}
                >
                    <Repeat2 />
                    Turn over
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={!images || saving !== null}
                    onClick={() => void download('image')}
                >
                    {saving === 'image' ? <Spinner /> : <ImageDown />}
                    Save as image
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={!images || saving !== null}
                    onClick={() => void download('pdf')}
                >
                    {saving === 'pdf' ? <Spinner /> : <FileDown />}
                    Download PDF
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                The image is for your phone. The PDF prints at wallet size,{' '}
                {CARD_MM.width} × {CARD_MM.height} mm, like a bank card.
            </p>
        </div>
    );
}

/**
 * The card large, flat and still on white, to hold up for staff to scan.
 * While it is open the screen stays on, where the browser allows it.
 */
function FullView({
    paint,
    label,
    name,
    children,
}: {
    paint: ((canvas: HTMLCanvasElement, width: number) => Promise<void>) | null;
    label: string;
    name: string;
    /** The button that opens it. */
    children: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open || !('wakeLock' in navigator)) {
            return;
        }

        let lock: WakeLockSentinel | null = null;
        let current = true;
        navigator.wakeLock.request('screen').then(
            (sentinel) => {
                if (current) {
                    lock = sentinel;
                } else {
                    void sentinel.release();
                }
            },
            () => undefined,
        );

        return () => {
            current = false;
            void lock?.release();
        };
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[96svh] w-auto max-w-[calc(100%-1rem)] justify-items-center gap-3 overflow-y-auto border-0 bg-paper p-4 text-paper-foreground sm:max-w-none sm:p-6">
                <div className="text-center">
                    <DialogTitle className="text-base font-medium">
                        Virtual ID of {name}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-[13px] text-paper-foreground/70">
                        Hold it up for staff to scan. A brighter screen scans
                        faster.
                    </DialogDescription>
                </div>
                <div
                    style={{
                        width: `min(calc(100vw - 3rem), calc((96svh - 9rem) * ${(CARD_MM.width / CARD_MM.height).toFixed(4)}), 26rem)`,
                    }}
                >
                    <CardCanvas
                        paint={paint}
                        label={label}
                        className="border"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
