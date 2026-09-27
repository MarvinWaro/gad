const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const sameYear = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
});
const otherYear = new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});
const full = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'long',
    timeStyle: 'short',
});

/** "just now", "12 minutes ago", "yesterday", then a plain date. */
export function formatRelative(iso: string | null, now = new Date()): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
    const absolute = Math.abs(seconds);

    if (absolute < 45) {
        return 'just now';
    }

    if (absolute < 3600) {
        return relative.format(Math.round(seconds / 60), 'minute');
    }

    if (absolute < 86400) {
        return relative.format(Math.round(seconds / 3600), 'hour');
    }

    if (absolute < 86400 * 6) {
        return relative.format(Math.round(seconds / 86400), 'day');
    }

    return date.getFullYear() === now.getFullYear()
        ? sameYear.format(date)
        : otherYear.format(date);
}

export function formatFull(iso: string | null): string {
    return iso ? full.format(new Date(iso)) : '';
}
