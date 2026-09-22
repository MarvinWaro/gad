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
