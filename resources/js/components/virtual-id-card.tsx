import { FileDown, ImageDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useInitials } from '@/hooks/use-initials';
import { toast } from '@/lib/toast';
import { CARD_MM } from '@/lib/virtual-id';
import type { CardImages, CardText } from '@/lib/virtual-id';
import {
    downloadCardImage,
    downloadCardPdf,
    loadCardImages,
    renderCard,
} from '@/lib/virtual-id-render';

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

/**
 * The Virtual ID as a wallet card, the size of a bank card held upright, to
 * show on a phone at the registration table, save as an image, or print. One
 * painter draws the screen, the image and the PDF (lib/virtual-id.ts), so
 * what is saved is what is shown.
 */
export function VirtualIdCard({ card }: { card: VirtualId }) {
    const getInitials = useInitials();
    const canvas = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<CardImages | null>(null);
    const [saving, setSaving] = useState<'image' | 'pdf' | null>(null);
    const text = useMemo<CardText>(
        () => ({
            name: card.name,
            affiliation: card.affiliation,
            code: card.code,
            initials: getInitials(card.name),
        }),
        [card.name, card.affiliation, card.code, getInitials],
    );

    useEffect(() => {
        let current = true;
        loadCardImages(card.photo).then(
            (loaded) => current && setImages(loaded),
        );

        return () => {
            current = false;
        };
    }, [card.photo]);

    // Redrawn at the screen's own pixel density whenever its width changes.
    useEffect(() => {
        const element = canvas.current;

        if (!element || !images) {
            return;
        }

        const draw = () =>
            void renderCard(
                element,
                element.clientWidth * (window.devicePixelRatio || 1),
                text,
                images,
                card.qr,
            );
        const observer = new ResizeObserver(draw);
        observer.observe(element);

        return () => observer.disconnect();
    }, [images, text, card.qr]);

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
        <div className="mx-auto w-full max-w-80 space-y-4 sm:mx-0">
            <canvas
                ref={canvas}
                role="img"
                aria-label={`Virtual ID of ${card.name}, ${card.affiliation}. Participant ID ${card.code}.`}
                className="block w-full shadow-sm"
                style={{
                    aspectRatio: `${CARD_MM.width} / ${CARD_MM.height}`,
                    // A bank card's 3.18 mm corners, as the canvas draws them.
                    borderRadius: `${(318 / CARD_MM.width).toFixed(2)}% / ${(318 / CARD_MM.height).toFixed(2)}%`,
                }}
            >
                {`${card.name}, ${card.affiliation}. Participant ID ${card.code}.`}
            </canvas>
            <div className="flex flex-wrap gap-2">
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
