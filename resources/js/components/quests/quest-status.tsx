import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { QuestStatus } from '@/types/quests';

/**
 * The status badges' language: open is live (emerald), a draft is
 * unpublished work (amber), and closed is retired (muted).
 */
const statuses: Record<QuestStatus, { label: string; className: string }> = {
    open: { label: 'Open', className: tones.positive.badge },
    draft: { label: 'Draft', className: tones.warning.badge },
    closed: { label: 'Closed', className: tones.neutral.badge },
};

export function QuestStatusPill({ status }: { status: QuestStatus }) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
                statuses[status].className,
            )}
        >
            {statuses[status].label}
        </span>
    );
}
