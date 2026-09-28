import type { AchieveItem } from '../data/achieve';
import type { SustainableGoal } from '../data/sdgs';

/** SDGs one post can support; mirrors App\Models\Post::MAX_SDGS. */
export const MAX_SDGS = 3;

/** Agenda items one post can support; mirrors Post::MAX_ACHIEVE_ITEMS. */
export const MAX_ACHIEVE_ITEMS = 3;

/** The smallest an SDG icon gets on a photo, in px. */
export const MIN_BADGE = 28;

/** Roughly how many icon widths the A.C.H.I.E.V.E. strip takes. */
const STRIP_UNITS = 2.8;

/**
 * How wide each SDG icon on a post's photos is, as a share of the photos'
 * width (cqw). It steps down as the row fills, from 9.5% for a lone icon to
 * about 6% for three icons and the agenda strip, so the row stays within a
 * third of the photo.
 */
export function badgeShare(sdgCount: number, hasAgenda: boolean): number {
    const units = Math.max(1, sdgCount + (hasAgenda ? STRIP_UNITS : 0));

    return Math.max(5.5, 9.5 - 0.75 * (units - 1));
}

/** badgeShare as a CSS length, never under MIN_BADGE nor over 72px. */
export function badgeSize(sdgCount: number, hasAgenda: boolean): string {
    return `clamp(${MIN_BADGE}px, ${badgeShare(sdgCount, hasAgenda).toFixed(2)}cqw, 72px)`;
}

/** "Goal 5: Gender Equality". */
export function sdgLabel(goal: SustainableGoal): string {
    return `Goal ${goal.number}: ${goal.name}`;
}

/** "A.C.H.I.E.V.E. A: Advanced and Accessible Lifelong Learning". */
export function achieveLabel(item: AchieveItem): string {
    return `A.C.H.I.E.V.E. ${item.letter}: ${item.title}`;
}

/** Names a badge row: every goal, then every agenda item, as one list. */
export function goalsSummary(
    goals: readonly SustainableGoal[],
    agenda: readonly AchieveItem[],
): string {
    return new Intl.ListFormat('en', { type: 'conjunction' }).format([
        ...goals.map(sdgLabel),
        ...agenda.map(achieveLabel),
    ]);
}

/** Adds or removes `value`, never adding past `max`. */
export function toggleWithin<T>(
    list: readonly T[],
    value: T,
    max: number,
): T[] {
    if (list.includes(value)) {
        return list.filter((item) => item !== value);
    }

    return list.length < max ? [...list, value] : [...list];
}
