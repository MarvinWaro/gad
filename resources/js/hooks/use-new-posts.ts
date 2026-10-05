import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedScope } from '@/types/people';

/** Away from the page this long, and coming back checks for new posts. */
export const AWAY_MS = 30_000;

/** Closer to the top than this, new posts load straight in. */
const TOP_ZONE = 200;

/** Where the feed's newest post sits: when it was posted, then its id. */
type FeedTop = { id: string; created_at: string | null };

/** Stands in for "no posts yet": every post comes after it. */
const BEFORE_ANY_POST = {
    id: '00000000000000000000000000',
    created_at: '1970-01-01T00:00:00Z',
};

type Waiting = { query: string; count: number };

/**
 * Keeps the community feed fresh, as Facebook does. When the reader comes
 * back after at least 30 seconds away (another tab, a locked phone), ask
 * how many posts arrived after the newest one they have. At the top of the
 * feed they load straight in; further down they wait behind a button, so
 * nothing moves under the reader. `enabled` false skips the check; `scope`
 * counts only the people followed.
 */
export function useNewPosts(
    newest: FeedTop | null,
    enabled = true,
    scope: FeedScope = 'all',
) {
    const [waiting, setWaiting] = useState<Waiting | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const hiddenAt = useRef<number | null>(null);
    const top =
        newest?.created_at != null
            ? { id: newest.id, created_at: newest.created_at }
            : BEFORE_ANY_POST;
    const query = new URLSearchParams({
        after: top.id,
        at: top.created_at,
        ...(scope !== 'all' ? { feed: scope } : {}),
    }).toString();

    /** Load the feed's first page again, from the top if asked. */
    const refresh = useCallback((fromTop = false) => {
        if (fromTop) {
            const reduced = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;
            window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        }

        setWaiting(null);
        setRefreshing(true);
        router.reload({
            reset: ['posts'],
            onFinish: () => setRefreshing(false),
        });
    }, []);

    useEffect(() => {
        async function check() {
            try {
                const response = await fetch(`/posts/newer?${query}`, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    return;
                }

                const { count } = (await response.json()) as { count: number };

                if (count === 0) {
                    return;
                }

                if (window.scrollY < TOP_ZONE) {
                    refresh();
                } else {
                    setWaiting({ query, count });
                }
            } catch {
                // Offline: the next return checks again.
            }
        }

        function onVisibilityChange() {
            if (document.visibilityState === 'hidden') {
                hiddenAt.current = Date.now();

                return;
            }

            const away =
                hiddenAt.current === null ? 0 : Date.now() - hiddenAt.current;
            hiddenAt.current = null;

            if (away >= AWAY_MS) {
                void check();
            }
        }

        if (!enabled) {
            return;
        }

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () =>
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
    }, [enabled, query, refresh]);

    return {
        // Only while the feed still starts where the count was taken; any
        // refresh or new post of the reader's own clears it.
        waiting: waiting?.query === query ? waiting.count : 0,
        refreshing,
        refresh,
    };
}
