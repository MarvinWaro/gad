export type SurveyOption = {
    value: string;
    label: string;
    requires_text?: boolean;
};

export const slugify = (label: string): string =>
    label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const toLines = (options?: SurveyOption[]): string =>
    (options ?? []).map((option) => option.label).join('\n');

/**
 * Parse a one-option-per-line textarea back into options.
 *
 * An option's `value` is the key written into every stored response, so it has
 * to survive a label edit: regenerating it from the label would orphan answers
 * already collected. Lines whose label is unchanged keep their value, the
 * remaining lines inherit the remaining old values in order (which is what a
 * rename looks like), and only genuinely new lines get a generated value.
 */
export const fromLines = (
    value: string,
    existing: SurveyOption[] = [],
): SurveyOption[] => {
    const labels = value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    const unclaimed = [...existing];
    const exactMatches = labels.map((label) => {
        const index = unclaimed.findIndex((option) => option.label === label);

        return index === -1 ? undefined : unclaimed.splice(index, 1)[0];
    });

    const used = new Set<string>();

    return labels.map((label, index) => {
        const previous = exactMatches[index] ?? unclaimed.shift();
        const base = previous?.value || slugify(label) || `option-${index + 1}`;
        let candidate = base;
        let suffix = 2;
        while (used.has(candidate)) {
            candidate = `${base}-${suffix}`;
            suffix += 1;
        }
        used.add(candidate);

        return {
            value: candidate,
            label,
            ...(previous?.requires_text ? { requires_text: true } : {}),
        };
    });
};
