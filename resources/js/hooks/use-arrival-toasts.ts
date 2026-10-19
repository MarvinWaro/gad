import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import {
    ARRIVAL_MS,
    toastArrival,
} from '@/components/notifications/arrival-toast';
import { getJson, useInbox } from '@/hooks/use-inbox';
import { toast } from '@/lib/toast';
import { index, recent } from '@/routes/notifications';
import type { NotificationPage } from '@/types/notifications';

/**
 * A toast for each notification as it arrives, like Facebook's: what it
 * says, with Open to go there, on every signed-in page with the bell.
 * Mounted once, by the bell. It stays quiet when the person is already
 * looking at their notifications (the bell's panel is open, or the
 * Notifications page). What arrives while the tab or window is out of sight
 * (another window over it counts) shows when they come back. Each arrival
 * costs one small request.
 */
export function useArrivalToasts({
    panelOpen,
    showPanel,
}: {
    panelOpen: boolean;
    /** Opens the bell's panel, for several arrivals at once. */
    showPanel: () => void;
}): void {
    const { unread, latest_at: latestAt } = useInbox();
    const { url } = usePage();
    // What the person has been shown or told about already.
    const seen = useRef({ latestAt, unread });
    // Arrivals held while out of sight: those newer than `since`.
    const held = useRef<{ since: string | null } | null>(null);
    const latestShowPanel = useRef(showPanel);
    const looking = panelOpen || url.split('?')[0] === index.url();

    useEffect(() => {
        latestShowPanel.current = showPanel;
    }, [showPanel]);

    useEffect(() => {
        const before = seen.current;
        seen.current = { latestAt, unread };

        const arrived =
            latestAt !== null &&
            (before.latestAt === null || latestAt > before.latestAt) &&
            unread > before.unread;

        if (!arrived || looking) {
            return;
        }

        if (document.visibilityState === 'hidden') {
            held.current ??= { since: before.latestAt };

            return;
        }

        announce(before.latestAt, () => latestShowPanel.current());
    }, [latestAt, unread, looking]);

    useEffect(() => {
        function onVisibilityChange() {
            if (document.visibilityState !== 'visible' || !held.current) {
                return;
            }

            const { since } = held.current;
            held.current = null;
            announce(since, () => latestShowPanel.current());
        }

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () =>
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
    }, []);
}

/** Toasts the unread notifications newer than `since`: one, or how many. */
function announce(since: string | null, showPanel: () => void): void {
    getJson<NotificationPage>(recent.url())
        .then((page) => {
            const fresh = (page?.data ?? []).filter(
                (notification) =>
                    notification.read_at === null &&
                    (since === null || notification.notified_at > since),
            );

            if (fresh.length === 1) {
                toastArrival(fresh[0]);
            } else if (fresh.length > 1) {
                toast.info(`${fresh.length} new notifications`, {
                    id: 'new-notifications',
                    duration: ARRIVAL_MS,
                    action: { label: 'View', onClick: showPanel },
                });
            }
        })
        .catch(() => {
            // Offline: the red count still says something came.
        });
}
