const connectives = new Set([
    'OF',
    'THE',
    'AND',
    'DE',
    'DEL',
    'DELA',
    'IN',
    'FOR',
    'INC',
    'INCORPORATED',
    'CO',
]);

/**
 * The acronym people use for an institution: "Notre Dame of Marbel
 * University" → "NDMU", "Ramon Magsaysay Memorial Colleges" → "RMMC".
 * Connectives and corporate suffixes are skipped; at most four letters.
 */
export function institutionInitials(name: string): string {
    const letters = name
        .toUpperCase()
        .split(/[\s,]+/u)
        .map((word) => word.replace(/[^\p{L}]/gu, ''))
        .filter((word) => word.length > 0 && !connectives.has(word))
        .map((word) => Array.from(word)[0])
        .slice(0, 4)
        .join('');

    return letters.length >= 2
        ? letters
        : Array.from(name.trim().toUpperCase()).slice(0, 2).join('');
}
