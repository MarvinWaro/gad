/**
 * The address's query with one value set, or taken out when empty, every
 * other key kept as it was: for filters that share a page and its address,
 * such as the homepage's statistics and events regions.
 */
export function withQueryValue(
    search: string,
    key: string,
    value: string | null,
): Record<string, string> {
    const params = new URLSearchParams(search);

    if (value) {
        params.set(key, value);
    } else {
        params.delete(key);
    }

    return Object.fromEntries(params);
}
