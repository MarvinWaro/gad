import type { ActivityTone } from '@/types/activity';

/**
 * How activity log entries and notifications are coloured, by what
 * happened: emerald when something began or went through, brand for a
 * change, amber when something paused or was sent back, red when removed
 * or refused, muted for data read out. `badge` is a tinted label, `edge` a
 * card's left border, `solid` a small filled mark with a white icon (each
 * at least 3:1 against its icon), and `ring` an outline in the same colour
 * (the scanner's camera after a result).
 */
export const tones: Record<
    ActivityTone,
    { badge: string; edge: string; solid: string; ring: string }
> = {
    positive: {
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
        edge: 'border-l-emerald-600 dark:border-l-emerald-500',
        solid: 'bg-emerald-600 text-white',
        ring: 'ring-emerald-600 dark:ring-emerald-500',
    },
    info: {
        badge: 'bg-brand-soft text-brand',
        edge: 'border-l-brand',
        solid: 'bg-brand text-brand-foreground',
        ring: 'ring-brand',
    },
    warning: {
        badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
        edge: 'border-l-amber-500',
        solid: 'bg-amber-600 text-white',
        ring: 'ring-amber-500',
    },
    danger: {
        badge: 'bg-destructive/10 text-destructive',
        edge: 'border-l-destructive',
        solid: 'bg-destructive text-white',
        ring: 'ring-destructive',
    },
    neutral: {
        badge: 'bg-muted text-muted-foreground',
        edge: 'border-l-muted-foreground/50',
        solid: 'bg-muted-foreground text-background',
        ring: 'ring-muted-foreground/50',
    },
};
