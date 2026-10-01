/**
 * Philippine time for the app's screens, whatever the viewer's device says.
 * The Philippines keeps UTC+8 all year, with no daylight saving.
 */
const timeZone = 'Asia/Manila';

/** An ISO time → "Oct 1, 2026, 5:00 PM". */
export function localDate(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone,
    }).format(new Date(value));
}

/** An ISO time → "Oct 1, 2026, 5:00:12 PM", to the second, as logs need. */
export function localDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone,
    }).format(new Date(value));
}

/** Now, as a datetime-local input's value in Philippine time. */
export function manilaInputNow(): string {
    // Sweden's format is ISO-like: "2026-10-01 17:00".
    return new Intl.DateTimeFormat('sv-SE', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone,
    })
        .format(new Date())
        .replace(' ', 'T');
}

/** A datetime-local value read as Philippine time → ISO 8601 with its offset. */
export function fromManilaInput(value: string): string {
    return `${value}:00+08:00`;
}
