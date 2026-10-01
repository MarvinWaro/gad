import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { POLL_MS } from '@/lib/notifications';
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

/** Update the shared count in place: no request, no change to the page. */
export function setInbox(inbox: Inbox): void {
    router.replaceProp('inbox', inbox);
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
 * Keeps the count fresh until PHLGADIS has live updates (Reverb): every 30
 * seconds while the tab is in view, and at once on coming back to it after
 * 30 seconds or more. Mounted once, by the bell.
 */
export function useInboxPolling(): void {
    const inbox = useInbox();
    const current = useRef(inbox);

    useEffect(() => {
        current.current = inbox;
    }, [inbox]);

    useEffect(() => {
        let checkedAt = Date.now();

        async function check() {
            checkedAt = Date.now();

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
                // Offline: the next check tries again.
            }
        }

        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                void check();
            }
        }, POLL_MS);

        function onVisibilityChange() {
            if (
                document.visibilityState === 'visible' &&
                Date.now() - checkedAt >= POLL_MS
            ) {
                void check();
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
    }, []);
}
