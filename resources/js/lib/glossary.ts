import type { GlossaryGroup, GlossaryTerm } from '../data/definition-of-terms';

export type HighlightPart = { text: string; match: boolean };

// Case, accent and apostrophe-style insensitive, so "victim's" finds
// "victim’s" and "Gender" finds "gender".
export function normalize(text: string) {
    return text
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .toLowerCase();
}

export function tokenize(query: string) {
    return [...new Set(normalize(query).split(/\s+/).filter(Boolean))];
}

export function termMatches(term: GlossaryTerm, tokens: string[]) {
    if (tokens.length === 0) return true;
    const haystack = normalize(
        [term.term, term.definition, ...(term.items ?? [])].join(' '),
    );
    return tokens.every((token) => haystack.includes(token));
}

// Every word in the query must appear somewhere in the entry. Groups are kept
// (possibly empty) so callers can show a per-law count.
export function filterGlossary(
    groups: GlossaryGroup[],
    tokens: string[],
): GlossaryGroup[] {
    return groups.map((group) => ({
        ...group,
        terms: group.terms.filter((term) => termMatches(term, tokens)),
    }));
}

export function highlightParts(
    text: string,
    tokens: string[],
): HighlightPart[] {
    if (tokens.length === 0 || text === '') return [{ text, match: false }];

    // Fold character by character so positions in the folded text map back
    // to the original, even where normalizing changes a character's length.
    let folded = '';
    const origin: number[] = [];
    for (let index = 0; index < text.length; index++) {
        for (const char of normalize(text[index])) {
            folded += char;
            origin.push(index);
        }
    }
    origin.push(text.length);

    const hits = Array.from({ length: text.length }, () => false);
    for (const token of tokens) {
        let from = folded.indexOf(token);
        while (from !== -1) {
            const end = origin[from + token.length];
            for (let index = origin[from]; index < end; index++) {
                hits[index] = true;
            }
            from = folded.indexOf(token, from + 1);
        }
    }

    const parts: HighlightPart[] = [];
    for (let index = 0; index < text.length; index++) {
        const last = parts.at(-1);
        if (last && last.match === hits[index]) {
            last.text += text[index];
        } else {
            parts.push({ text: text[index], match: hits[index] });
        }
    }

    return parts;
}
