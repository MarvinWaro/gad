/**
 * Where the browser listens for live updates, and the channels the signed-in
 * person may follow (HandleInertiaRequests). Null while they are off.
 */
export type Realtime = {
    key: string;
    host: string;
    port: number;
    scheme: 'http' | 'https';
    cluster: string;
    /** Their own channel: their notifications changed. */
    user: string;
    /** Module code (LiveChannels) => the channels to follow for it. */
    modules: Partial<Record<string, string[]>>;
};
