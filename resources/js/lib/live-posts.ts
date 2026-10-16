/**
 * Keeping a feed's posts current from live updates (docs/realtime.md): which
 * posts to ask for again, and swapping the fresh ones in.
 */

/** Posts asked for at once, as LivePostsRequest allows. */
export const POSTS_PER_ASK = 20;

type Identified = { id: string };

/**
 * The posts shown that a `posts` signal names. A signal without a list (the
 * connection dropped and came back) may have missed anything: all of them.
 */
export function postsToRefresh(
    signal: unknown,
    shown: readonly Identified[],
): string[] {
    const named = namedPosts(signal);

    return shown
        .filter((post) => named === null || named.has(post.id))
        .map((post) => post.id);
}

/**
 * The feed with the asked-for posts swapped for their fresh copies, in
 * place. One asked for but not sent back was deleted: it leaves the feed.
 * The others stay as they are, so their cards keep what the reader did.
 */
export function swapFreshPosts<T extends Identified>(
    current: readonly T[],
    asked: readonly string[],
    fresh: readonly T[],
): T[] {
    const askedFor = new Set(asked);
    const byId = new Map(fresh.map((post) => [post.id, post]));

    return current.flatMap((post) => {
        if (!askedFor.has(post.id)) {
            return [post];
        }

        const next = byId.get(post.id);

        return next ? [next] : [];
    });
}

function namedPosts(signal: unknown): Set<string> | null {
    if (
        typeof signal !== 'object' ||
        signal === null ||
        !('ids' in signal) ||
        !Array.isArray(signal.ids)
    ) {
        return null;
    }

    return new Set(
        signal.ids.filter((id): id is string => typeof id === 'string'),
    );
}
