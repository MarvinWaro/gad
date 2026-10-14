import { Link, router } from '@inertiajs/react';
import { Link2, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { pair, show } from '@/routes/settings/certificates';
import type { CertificateDesign } from '@/types/certificates';

/**
 * A design's pair, of the other kind (docs/certificates.md): edited on its
 * own, but chosen for events and released together. Without one, it can be
 * made from this design: the same look and signatories, its own wording.
 */
export function DesignPair({
    design,
    otherTitle,
}: {
    design: CertificateDesign;
    /** The other kind's title, such as "Certificate of Appearance". */
    otherTitle: string;
}) {
    const [making, setMaking] = useState(false);

    if (design.partner) {
        return (
            <p className="flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] text-pretty text-muted-foreground">
                <Link2 aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                    Paired with its {design.partner.title},{' '}
                    <Link
                        href={show.url(design.partner.id)}
                        className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        {design.partner.name}
                    </Link>
                    . Events get both, chosen and released together; each keeps
                    its own wording.
                </span>
            </p>
        );
    }

    if (!design.can.pair) {
        return null;
    }

    return (
        <div className="space-y-2 rounded-lg border px-3 py-3">
            <p className="text-[13px] text-pretty text-muted-foreground">
                Giving both kinds at an event? Make its {otherTitle}: the same
                look and signatories, with its own wording to edit. Events then
                get both, chosen and released together.
            </p>
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={making}
                onClick={() =>
                    router.post(
                        pair.url(design.id),
                        {},
                        {
                            onStart: () => setMaking(true),
                            onFinish: () => setMaking(false),
                        },
                    )
                }
            >
                {making ? <Spinner /> : <Plus />}
                Make its {otherTitle}
            </Button>
        </div>
    );
}
