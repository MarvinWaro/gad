import { eventStatuses } from '@/lib/event-dates';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { EventStatus } from '@/types';

/**
 * Where an event stands now: "Happening now" (emerald, with a pulsing dot),
 * "Upcoming" or "Ended", in words so colour is never the only cue.
 */
export function EventStatusBadge({
    status,
    className,
}: {
    status: EventStatus;
    className?: string;
}) {
    const { label, tone } = eventStatuses[status];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                tones[tone].badge,
                className,
            )}
        >
            {status === 'ongoing' && (
                <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-emerald-600 motion-safe:animate-pulse dark:bg-emerald-400"
                />
            )}
            {label}
        </span>
    );
}
