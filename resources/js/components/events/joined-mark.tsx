import { CircleCheck } from 'lucide-react';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';

/**
 * "Joined", beside an event the viewer joined (docs/event-registration.md):
 * an icon and the word, so colour is never the only cue. On the violet
 * next-event card it takes the card's own white.
 */
export function JoinedMark({
    onSignature = false,
    className,
}: {
    onSignature?: boolean;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                onSignature
                    ? 'bg-on-signature/15 text-on-signature'
                    : tones.positive.badge,
                className,
            )}
        >
            <CircleCheck aria-hidden className="size-3.5" />
            Joined
        </span>
    );
}
