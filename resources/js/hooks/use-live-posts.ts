import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { getJson } from '@/hooks/use-inbox';
import { useCatchUp, useLive, useLiveModules } from '@/hooks/use-live';
import {
    POSTS_PER_ASK,
    postsToRefresh,
    swapFreshPosts,
} from '@/lib/live-posts';
import { isNavigating } from '@/lib/navigation';
import { live } from '@/routes/posts';
import type { Post } from '@/types';

/** While the community is busy, ask at most this often. */
const GAP = 2_000;

/**
 * Keeps the posts already in a feed current, as Facebook does
 * (docs/realtime.md). When live updates name posts it shows (someone
 * commented, reacted, shared, edited or deleted one), it asks for just those
 * again, as the reader sees them, and swaps them in without a reload: the
 * scroll, the loaded pages and an open post stay where they are.
 */
export function useLivePosts(posts: Post[]): void {
    const shown = useRef(posts);
    const waiting = useRef(new Set<string>());
    const catchUp = useCatchUp(
        () => {
            const ids = [...waiting.current];
            waiting.current.clear();
            void swapIn(ids);
        },
        { gap: GAP },
    );

    useEffect(() => {
        shown.current = posts;
    }, [posts]);

    useLive(useLiveModules('community'), 'posts', (signal) => {
        const ids = postsToRefresh(signal, shown.current);

        if (ids.length > 0) {
            ids.forEach((id) => waiting.current.add(id));
            catchUp.request();
        }
    });
}

async function swapIn(ids: string[]) {
    for (let start = 0; start < ids.length; start += POSTS_PER_ASK) {
        const asked = ids.slice(start, start + POSTS_PER_ASK);

        try {
            const answer = await getJson<{ data: Post[] }>(
                live.url({ query: { ids: asked } }),
            );

            if (answer && !isNavigating()) {
                router.replaceProp('posts.data', (current: unknown) =>
                    Array.isArray(current)
                        ? swapFreshPosts(current as Post[], asked, answer.data)
                        : current,
                );
            }
        } catch {
            // Offline: the next signal asks again.
        }
    }
}
