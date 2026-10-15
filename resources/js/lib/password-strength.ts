type Requirement = { label: string; met: (value: string) => boolean };

const required: Record<string, Requirement> = {
    letter: { label: 'A letter', met: (v) => /[A-Za-z]/.test(v) },
    lower: { label: 'A lowercase letter', met: (v) => /[a-z]/.test(v) },
    upper: { label: 'An uppercase letter', met: (v) => /[A-Z]/.test(v) },
    digit: { label: 'A number', met: (v) => /\d/.test(v) },
    special: { label: 'A symbol', met: (v) => /[^A-Za-z0-9]/.test(v) },
};

const kindsOfCharacter = ['lower', 'upper', 'digit', 'special'].map(
    (name) => required[name],
);

export const strengthLevels = [
    { label: 'Too short', tone: 'danger' },
    { label: 'Weak', tone: 'danger' },
    { label: 'Fair', tone: 'warning' },
    { label: 'Good', tone: 'positive' },
    { label: 'Strong', tone: 'positive' },
] as const;

export type PasswordCheck = {
    /** Each rule the server holds a new password to, and whether it is met. */
    rules: { label: string; met: boolean }[];
    /** 0 "Too short" to 4 "Strong". */
    score: number;
    level: (typeof strengthLevels)[number];
};

/**
 * A new password against the server's rules, read from the same
 * `passwordrules` string the field carries (Password::defaults()), so the
 * list never says more or less than the server checks. Past the rules, the
 * score grows with length (12 or more) and kinds of character.
 */
export function checkPassword(
    value: string,
    passwordRules: string,
): PasswordCheck {
    const min = Number(/minlength:\s*(\d+)/.exec(passwordRules)?.[1] ?? 8);
    const requirements: Requirement[] = [
        { label: `At least ${min} characters`, met: (v) => v.length >= min },
    ];

    const names = [...passwordRules.matchAll(/required:\s*(\w+)/g)].map(
        (match) => match[1],
    );
    for (const name of names) {
        // Laravel writes letters() as "required: lower" without "upper".
        const key =
            name === 'lower' && !names.includes('upper') ? 'letter' : name;
        if (required[key]) requirements.push(required[key]);
    }

    const rules = requirements.map(({ label, met }) => ({
        label,
        met: met(value),
    }));
    const kinds = kindsOfCharacter.filter((kind) => kind.met(value)).length;
    const score =
        value.length < min
            ? 0
            : !rules.every((rule) => rule.met)
              ? 1
              : Math.min(
                    4,
                    1 +
                        Number(value.length >= 12) +
                        Number(kinds >= 2) +
                        Number(kinds >= 3),
                );

    return { rules, score, level: strengthLevels[score] };
}
