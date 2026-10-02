import type { Comparable } from '@/types/dashboard';

export const formatCount = (value: number) => value.toLocaleString('en-PH');

/** A part's share of a whole, in whole percent; 0 when there is no whole. */
export function percentOf(part: number, whole: number): number {
    return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** How a figure moved since the period before, such as "+12.5% vs. August". */
export function changeLabel(
    { value, previous }: Comparable,
    comparison: string,
): string {
    if (previous === 0) {
        return value === 0
            ? `No change ${comparison}`
            : `Up from 0 ${comparison}`;
    }

    const change = ((value - previous) / previous) * 100;

    return `${change > 0 ? '+' : ''}${change.toFixed(1)}% ${comparison}`;
}

/** A heatmap step from 0 (none) to 4, relative to the largest value. */
export function heatLevel(value: number, max: number): 0 | 1 | 2 | 3 | 4 {
    if (value <= 0 || max <= 0) {
        return 0;
    }

    return Math.min(4, Math.max(1, Math.ceil((value / max) * 4))) as
        | 1
        | 2
        | 3
        | 4;
}

/** The months of an academic year, August first, as filter choices. */
export const academicMonths = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7].map(
    (month) => ({
        value: String(month),
        label: new Date(2000, month - 1, 1).toLocaleString('en-PH', {
            month: 'long',
        }),
    }),
);
