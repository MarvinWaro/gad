/** How often the bell asks whether anything new arrived. */
export const POLL_MS = 30_000;

/** The bell's count: the number up to 9, then "9+". */
export function badgeLabel(unread: number): string {
    return unread > 9 ? '9+' : String(unread);
}

/** "You have 2 unread notifications", or that nothing is waiting. */
export function unreadSentence(unread: number): string {
    if (unread === 0) {
        return 'You’re all caught up';
    }

    return unread === 1
        ? 'You have 1 unread notification'
        : `You have ${unread.toLocaleString('en-PH')} unread notifications`;
}

/** The bell's accessible name. */
export function bellLabel(unread: number): string {
    return unread === 0
        ? 'Notifications'
        : `Notifications, ${unread.toLocaleString('en-PH')} unread`;
}
