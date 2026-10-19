import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatchUp, LiveEvent, LiveStatus } from '@/lib/realtime';
import { isNavigating } from '@/lib/navigation';
import { createCatchUp, listen, onLiveStatus } from '@/lib/realtime';
import type { Realtime } from '@/types/realtime';

/**
 * The place to listen, kept steady across visits: every page sends it
 * again, and only a different account or server should start over.
 */
function useRealtime() {
    const realtime = usePage().props.realtime ?? null;
    const current = useRef<Realtime | null>(realtime);
    const id = realtime
        ? `${realtime.user}|${realtime.key}|${realtime.host}:${realtime.port}`
        : '';

    useEffect(() => {
        current.current = realtime;
    }, [realtime]);

    return { current, id };
}

/**
 * The channels the signed-in person follows for some modules (the codes in
 * App\Support\LiveChannels), as the server allows them.
 */
export function useLiveModules(...modules: string[]): string[] {
    const modulesFollowed = usePage().props.realtime?.modules;
    const key = modules.join('|');

    return useMemo(
        () =>
            key.split('|').flatMap((module) => modulesFollowed?.[module] ?? []),
        [key, modulesFollowed],
    );
}

/**
 * Call `onSignal` whenever one of the channels hears `event`, with what the
 * signal carries (only `posts` carries anything; nothing after a dropped
 * connection comes back). Nothing happens while live updates are off.
 */
export function useLive(
    channels: string[],
    event: LiveEvent,
    onSignal: (data?: unknown) => void,
): void {
    const realtime = useRealtime();
    const latest = useRef(onSignal);
    const key = channels.join('|');

    useEffect(() => {
        latest.current = onSignal;
    }, [onSignal]);

    useEffect(() => {
        const config = realtime.current.current;

        if (realtime.id === '' || config === null || key === '') {
            return;
        }

        const stops = key
            .split('|')
            .map((channel) =>
                listen(config, channel, event, (data) => latest.current(data)),
            );

        return () => stops.forEach((stop) => stop());
    }, [realtime.current, realtime.id, key, event]);
}

/**
 * Run `catchUp` after signals: once for a burst, at most once per `gap`
 * milliseconds, and when a hidden tab is looked at again (createCatchUp).
 */
export function useCatchUp(
    catchUp: () => void,
    { gap = 0 }: { gap?: number } = {},
): CatchUp {
    const latest = useRef(catchUp);
    const scheduler = useMemo(
        () => createCatchUp(() => latest.current(), { gap }),
        [gap],
    );

    useEffect(() => {
        latest.current = catchUp;
    }, [catchUp]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                scheduler.resume();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            scheduler.cancel();
            document.removeEventListener(
                'visibilitychange',
                onVisibilityChange,
            );
        };
    }, [scheduler]);

    return scheduler;
}

/**
 * Re-read some of the page's props whenever one of the channels says what
 * they show changed (useCatchUp). Only those props reload (all of them when
 * `only` is empty), so forms, scroll and open dialogs stay as they are.
 * Never list a scrolling prop (Inertia::scroll): it would start over; a
 * feed keeps its posts current with useLivePosts.
 */
export function useLiveReload(
    channels: string[],
    only: string[],
    { gap = 0, event = 'changed' }: { gap?: number; event?: LiveEvent } = {},
): void {
    const props = only.join('|');
    const catchUp = useCatchUp(
        () => {
            // A page on its way out is replaced with fresh props anyway.
            if (!isNavigating()) {
                router.reload(props === '' ? {} : { only: props.split('|') });
            }
        },
        { gap },
    );

    useLive(channels, event, catchUp.request);
}

/** The person's own channel, which hears `inbox` when their notifications change. */
export function useOwnChannel(): string[] {
    const user = usePage().props.realtime?.user;

    return useMemo(() => (user ? [user] : []), [user]);
}

/** Whether live updates are coming through; null while they are off. */
export function useLiveStatus(): LiveStatus | null {
    const realtime = useRealtime();
    const [status, setStatus] = useState<LiveStatus | null>(null);

    useEffect(() => {
        const config = realtime.current.current;

        return realtime.id !== '' && config !== null
            ? onLiveStatus(config, setStatus)
            : undefined;
    }, [realtime.current, realtime.id]);

    return realtime.id !== '' ? status : null;
}
