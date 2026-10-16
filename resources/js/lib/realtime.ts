import type { ChannelAuthorizationCallback } from 'pusher-js';
import type Pusher from 'pusher-js';
import type { Realtime } from '@/types/realtime';

/**
 * Live updates (docs/realtime.md): one WebSocket to Berth's Soketi app per
 * tab, opened the first time a signed-in page listens. pusher-js loads only
 * then, so the public site never downloads it.
 *
 * Signals carry next to nothing: `changed` says a record a page shows
 * changed, `inbox` that the person's notifications did, and `posts` names
 * the posts that changed, for the feeds. The page asks the server again,
 * which still decides what its reader may see.
 */
export type LiveEvent = 'changed' | 'inbox' | 'posts';

export type LiveStatus = 'connecting' | 'connected' | 'unavailable';

/** Told what the signal carries; nothing when catching up after a drop. */
type Listener = (data?: unknown) => void;

/** Where private channels are signed, as Laravel registers it. */
const AUTH_URL = '/broadcasting/auth';

let socket: Promise<Pusher> | null = null;
let socketFor = '';
let status: LiveStatus = 'connecting';
const listeners = new Set<Listener>();
const followers = new Map<string, number>();
const statusListeners = new Set<(status: LiveStatus) => void>();

/**
 * Hear `event` on a private channel. Returns the function that stops
 * listening, and leaves the channel once nobody on the page listens.
 */
export function listen(
    config: Realtime,
    channel: string,
    event: LiveEvent,
    listener: Listener,
): () => void {
    const name = `private-${channel}`;
    const connection = connect(config);
    let listening = true;
    listeners.add(listener);
    followers.set(name, (followers.get(name) ?? 0) + 1);

    void connection.then((pusher) => {
        if (listening) {
            (pusher.channel(name) ?? pusher.subscribe(name)).bind(
                event,
                listener,
            );
        }
    });

    return () => {
        listening = false;
        listeners.delete(listener);
        followers.set(name, (followers.get(name) ?? 1) - 1);

        void connection.then((pusher) => {
            pusher.channel(name)?.unbind(event, listener);

            if ((followers.get(name) ?? 0) <= 0) {
                followers.delete(name);
                pusher.unsubscribe(name);
            }
        });
    };
}

/** Follow whether live updates are coming through; told the current state at once. */
export function onLiveStatus(
    config: Realtime,
    listener: (status: LiveStatus) => void,
): () => void {
    void connect(config);
    statusListeners.add(listener);
    listener(status);

    return () => {
        statusListeners.delete(listener);
    };
}

function connect(config: Realtime): Promise<Pusher> {
    const target = `${config.key}@${config.host}:${config.port}`;

    if (socket !== null && socketFor === target) {
        return socket;
    }

    void socket?.then((pusher) => pusher.disconnect());
    socketFor = target;
    socket = import('pusher-js').then(({ default: PusherClient }) => {
        const pusher = new PusherClient(config.key, {
            cluster: config.cluster,
            wsHost: config.host,
            wsPort: config.port,
            wssPort: config.port,
            forceTLS: config.scheme === 'https',
            enabledTransports: ['ws', 'wss'],
            disableStats: true,
            channelAuthorization: {
                endpoint: AUTH_URL,
                transport: 'ajax',
                customHandler: authorize,
            },
        });
        let connectedBefore = false;

        pusher.connection.bind(
            'state_change',
            ({ current }: { current: string }) => {
                const next = statusOf(current);

                // Back after a drop: whatever changed meanwhile went unheard.
                if (next === 'connected' && connectedBefore) {
                    listeners.forEach((listener) => listener());
                }

                connectedBefore ||= next === 'connected';
                setStatus(next);
            },
        );

        return pusher;
    });

    return socket;
}

function statusOf(state: string): LiveStatus {
    if (state === 'connected') {
        return 'connected';
    }

    return state === 'initialized' || state === 'connecting'
        ? 'connecting'
        : 'unavailable';
}

function setStatus(next: LiveStatus) {
    if (next !== status) {
        status = next;
        statusListeners.forEach((listener) => listener(next));
    }
}

/** Sign a private channel with the person's session, as any form posts. */
function authorize(
    { socketId, channelName }: { socketId: string; channelName: string },
    callback: ChannelAuthorizationCallback,
) {
    fetch(AUTH_URL, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        body: JSON.stringify({
            socket_id: socketId,
            channel_name: channelName,
        }),
    })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(
                    `Live updates: ${channelName} refused (${response.status})`,
                );
            }

            callback(null, await response.json());
        })
        .catch((error: Error) => callback(error, null));
}

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);

    return match ? decodeURIComponent(match[1]) : '';
}

export type CatchUp = {
    /** Something changed: run soon, once for a burst of signals. */
    request: () => void;
    /** The tab is in view again: run if it missed something while hidden. */
    resume: () => void;
    cancel: () => void;
};

type CatchUpOptions = {
    /** Wait this long after a signal, so a burst runs once. */
    delay?: number;
    /** Never run more often than this. */
    gap?: number;
    now?: () => number;
    hidden?: () => boolean;
    setTimer?: (run: () => void, ms: number) => unknown;
    clearTimer?: (timer: unknown) => void;
};

/**
 * Runs a page's catch-up after signals: shortly after the first of a burst,
 * at most once per `gap`, and never while the tab is hidden; a hidden tab
 * catches up when it is looked at again.
 */
export function createCatchUp(
    run: () => void,
    {
        delay = 400,
        gap = 0,
        now = Date.now,
        hidden = () => document.visibilityState === 'hidden',
        setTimer = (callback, ms) => window.setTimeout(callback, ms),
        clearTimer = (timer) => window.clearTimeout(timer as number),
    }: CatchUpOptions = {},
): CatchUp {
    let timer: unknown = null;
    let lastRun = -Infinity;
    let stale = false;

    function fire() {
        timer = null;

        if (hidden()) {
            stale = true;

            return;
        }

        lastRun = now();
        run();
    }

    function request() {
        if (hidden()) {
            stale = true;

            return;
        }

        if (timer !== null) {
            return;
        }

        const at = Math.max(now() + delay, lastRun + gap);
        timer = setTimer(fire, at - now());
    }

    return {
        request,
        resume() {
            if (stale) {
                stale = false;
                request();
            }
        },
        cancel() {
            if (timer !== null) {
                clearTimer(timer);
                timer = null;
            }
        },
    };
}
