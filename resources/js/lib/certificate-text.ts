/**
 * The words a certificate fills in (docs/certificates.md): the blanks in its
 * wording, and the dates written out as certificates write them. Pure, so
 * the PDF and its tests read them the same way.
 */

/** `CertificateDesign::BLANKS`. */
export const CERTIFICATE_BLANKS = [
    'event',
    'dates',
    'days',
    'venue',
    'released',
] as const;

export type CertificateBlank = (typeof CERTIFICATE_BLANKS)[number];

/** What each blank stands for, as the editor's "Insert blank" chips say. */
export const blankLabels: Record<CertificateBlank, string> = {
    event: 'Event title',
    dates: 'Event dates',
    days: 'Days attended',
    venue: 'Venue',
    released: 'Date given',
};

/** A run of the wording; the event's title is printed bold. */
export type TextRun = { text: string; bold: boolean };

const monthName = new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    timeZone: 'UTC',
});

type Day = { year: number; month: number; day: number };

/** "2026-10-14" or "2026-10-14T09:00:00", read without a time zone. */
function readDay(value: string): Day | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

    return match
        ? {
              year: Number(match[1]),
              month: Number(match[2]),
              day: Number(match[3]),
          }
        : null;
}

function month(day: Day): string {
    return monthName.format(Date.UTC(day.year, day.month - 1, 1));
}

/** "a", "a and b", "a, b and c". */
function joinAnd(parts: string[]): string {
    return parts.length <= 1
        ? (parts[0] ?? '')
        : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * An event's dates: "October 14, 2026", "October 14–16, 2026",
 * "October 30 – November 2, 2026" or "December 30, 2026 – January 2, 2027".
 */
export function certificateDates(
    startsAt: string,
    endsAt: string | null,
): string {
    const start = readDay(startsAt);
    const end = endsAt ? readDay(endsAt) : null;

    if (!start) {
        return '';
    }

    if (
        !end ||
        (end.year === start.year &&
            end.month === start.month &&
            end.day === start.day)
    ) {
        return `${month(start)} ${start.day}, ${start.year}`;
    }

    if (end.year !== start.year) {
        return `${month(start)} ${start.day}, ${start.year} – ${month(end)} ${end.day}, ${end.year}`;
    }

    return end.month === start.month
        ? `${month(start)} ${start.day}–${end.day}, ${start.year}`
        : `${month(start)} ${start.day} – ${month(end)} ${end.day}, ${start.year}`;
}

/**
 * The days someone was checked in: "October 14, 2026",
 * "October 14, 16 and 17, 2026", "October 31 and November 1, 2026".
 */
export function attendedDays(days: string[]): string {
    const sorted = days
        .map(readDay)
        .filter((day): day is Day => day !== null)
        .sort((a, b) => a.year - b.year || a.month - b.month || a.day - b.day);
    const years = new Map<number, Map<number, Day[]>>();

    for (const day of sorted) {
        const months = years.get(day.year) ?? new Map<number, Day[]>();
        months.set(day.month, [...(months.get(day.month) ?? []), day]);
        years.set(day.year, months);
    }

    return joinAnd(
        [...years].map(
            ([year, months]) =>
                `${joinAnd(
                    [...months.values()].map(
                        (list) =>
                            `${month(list[0])} ${joinAnd(list.map((day) => String(day.day)))}`,
                    ),
                )}, ${year}`,
        ),
    );
}

/** 1st, 2nd, 3rd, 4th … 11th, 12th, 13th … 21st. */
function ordinal(day: number): string {
    const teen = day % 100 >= 11 && day % 100 <= 13;
    const suffix = teen
        ? 'th'
        : ({ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th');

    return `${day}${suffix}`;
}

/** The formal "12th day of October 2026" of "Given this …". */
export function formalDate(value: string): string {
    const day = readDay(value);

    return day ? `${ordinal(day.day)} day of ${month(day)} ${day.year}` : '';
}

/**
 * The wording with its blanks filled in. The event's title is bold; a blank
 * with nothing to say is left out, and one the wording doesn't know stays
 * as it was typed.
 */
export function fillBlanks(
    body: string,
    values: Record<CertificateBlank, string>,
): TextRun[] {
    const runs: TextRun[] = [];
    const add = (text: string, bold = false) => {
        if (text === '') {
            return;
        }

        const last = runs[runs.length - 1];

        if (last && last.bold === bold) {
            last.text += text;
        } else {
            runs.push({ text, bold });
        }
    };
    let rest = body.replace(/\s+/g, ' ').trim();

    while (rest !== '') {
        const match = /\{([^{}]*)\}/.exec(rest);

        if (!match) {
            add(rest);
            break;
        }

        add(rest.slice(0, match.index));
        const blank = CERTIFICATE_BLANKS.find((known) => known === match[1]);
        add(blank ? values[blank] : match[0], blank === 'event');
        rest = rest.slice(match.index + match[0].length);
    }

    return runs;
}
