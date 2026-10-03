import type { ProgramRecord, SexFilter } from '../data/phlgadis-demo';

export function summarize(records: ProgramRecord[]) {
    const male = records.reduce((sum, row) => sum + row.male, 0);
    const female = records.reduce((sum, row) => sum + row.female, 0);
    const total = male + female;
    return {
        male,
        female,
        total,
        malePercentage: total ? (male / total) * 100 : 0,
        femalePercentage: total ? (female / total) * 100 : 0,
    };
}
export function filterRecords(records: ProgramRecord[], sex: SexFilter) {
    return records.map((row) => ({
        ...row,
        male: sex === 'female' ? 0 : row.male,
        female: sex === 'male' ? 0 : row.female,
    }));
}
export const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-PH').format(value);

const totalOf = (row: ProgramRecord) => row.male + row.female;

/**
 * A group's name broken into at most two lines for a chart axis: words fill
 * the first line up to `width` characters and the rest goes on the second,
 * so no word is cut and nothing is left out.
 */
export function axisLines(name: string, width = 18): string[] {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const first: string[] = [];

    while (
        words.length > 0 &&
        (first.length === 0 || [...first, words[0]].join(' ').length <= width)
    ) {
        first.push(words.shift()!);
    }

    return words.length > 0
        ? [first.join(' '), words.join(' ')]
        : [first.join(' ')];
}

/** Women's share of a group in whole percent; 0 for an empty group. */
export function femaleShare(row: ProgramRecord): number {
    const total = totalOf(row);
    return total ? Math.round((row.female / total) * 100) : 0;
}

/** Groups by size, largest first; ties keep their order. */
export function byTotal(records: ProgramRecord[]): ProgramRecord[] {
    return [...records].sort((a, b) => totalOf(b) - totalOf(a));
}

/** Groups by women's share, highest first; ties keep their order. */
export function byFemaleShare(records: ProgramRecord[]): ProgramRecord[] {
    const share = (row: ProgramRecord) =>
        totalOf(row) ? row.female / totalOf(row) : 0;
    return [...records].sort((a, b) => share(b) - share(a));
}

/**
 * The longest bar in view, which every bar is drawn against so lengths
 * compare honestly across groups and between women and men.
 */
export function largestBar(records: ProgramRecord[], sex: SexFilter): number {
    return Math.max(
        0,
        ...records.flatMap((row) => [
            sex === 'female' ? 0 : row.male,
            sex === 'male' ? 0 : row.female,
        ]),
    );
}
