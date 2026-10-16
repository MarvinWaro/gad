import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';
import { useLive, useLiveStatus } from '@/hooks/use-live';
import { isNavigating } from '@/lib/navigation';
import { POLL_LIVE_MS, POLL_MS } from '@/lib/notifications';
import { summary } from '@/routes/notifications';
import type { Inbox } from '@/types/notifications';

const EMPTY: Inbox = { unread: 0, latest_at: null };

/**
 * The signed-in person's unread count and newest arrival, shared with every
 * page. The server sends it with each page; the bell's checks and the
 * notification actions write it back through `setInbox`.
 */
export function useInbox(): Inbox {
    return usePage().props.inbox ?? EMPTY;
}

/**
 * Update the shared count in place: no request, no change to the page. Not
 * while another page is opening, which brings its own count.
 */
export function setInbox(inbox: Inbox): void {
    if (!isNavigating()) {
        router.replaceProp('inbox', inbox);
    }
}

/** GET a JSON endpoint as the signed-in person, or null when it fails. */
export async function getJson<T>(url: string, signal?: AbortSignal) {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
        signal,
    });

    return response.ok ? ((await response.json()) as T) : null;
}

/**
 * Keeps the count fresh. With live updates it asks again as soon as the
 * person's notifications change (docs/realtime.md), and every 2 minutes in
 * case the server cannot send them (a wrong host, a rotated secret); without
 * them, or while the connection is down, every 30 seconds. Only while the tab
 * is in view, and at once on coming back to it after that long. Mounted
 * once, by the bell.
 */
export function useInboxUpdates(): void {
    const inbox = useInbox();
    const current = useRef(inbox);
    const realtime = usePage().props.realtime;
    const live = useLiveStatus() === 'connected';

    useEffect(() => {
        current.current = inbox;
    }, [inbox]);

    const check = useCallback(async () => {
        try {
            const next = await getJson<Inbox>(summary.url());
            const shown = current.current;

            if (
                next &&
                (next.unread !== shown.unread ||
                    next.latest_at !== shown.latest_at)
            ) {
                setInbox(next);
            }
        } catch {
            // Offline: the next signal or check tries again.
        }
    }, []);

    useLive(realtime ? [realtime.user] : [], 'inbox', check);

    useEffect(() => {
        const every = live ? POLL_LIVE_MS : POLL_MS;
        let checkedAt = Date.now();
        const poll = () => {
            checkedAt = Date.now();
            void check();
        };

        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                poll();
            }
        }, every);

        function onVisibilityChange() {
            if (
                document.visibilityState === 'visible' &&
                Date.now() - checkedAt >= every
            ) {
                poll();
            }
        }

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
        };
    }, [live, check]);
}
