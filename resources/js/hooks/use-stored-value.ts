import { useCallback, useSyncExternalStore } from 'react';

/** Kept for this visit where the browser refuses storage (a private window). */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
    try {
        return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
    } catch {
        return memory.get(key) ?? null;
    }
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    // Another tab changed it.
    window.addEventListener('storage', listener);

    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', listener);
    };
}

/**
 * A small choice remembered in this browser, such as a folded group or the
 * scanner's sound. The page first draws as the server drew it, with nothing
 * saved, then the saved choice follows at once, so the two always match
 * (hydration).
 */
export function useStoredValue(
    key: string,
): [string | null, (value: string) => void] {
    const value = useSyncExternalStore(
        subscribe,
        () => read(key),
        () => null,
    );
    const store = useCallback(
        (next: string) => {
            try {
                window.localStorage.setItem(key, next);
            } catch {
                memory.set(key, next);
            }

            listeners.forEach((listener) => listener());
        },
        [key],
    );

    return [value, store];
}
