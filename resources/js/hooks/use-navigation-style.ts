import { useSyncExternalStore } from 'react';

export type NavigationStyle = 'sidebar' | 'header';

const storageKey = 'navigation-style';
const listeners = new Set<() => void>();
let currentStyle: NavigationStyle = 'sidebar';

function isNavigationStyle(value: string | null): value is NavigationStyle {
    return value === 'sidebar' || value === 'header';
}

function notify(): void {
    listeners.forEach((listener) => listener());
}

export function initializeNavigationStyle(): void {
    if (typeof window === 'undefined') return;

    const saved = window.localStorage.getItem(storageKey);
    currentStyle = isNavigationStyle(saved) ? saved : 'sidebar';

    window.addEventListener('storage', (event) => {
        if (event.key !== storageKey) return;
        currentStyle = isNavigationStyle(event.newValue)
            ? event.newValue
            : 'sidebar';
        notify();
    });
}

export function useNavigationStyle() {
    const style = useSyncExternalStore(
        (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        () => currentStyle,
        () => 'sidebar',
    );

    const updateStyle = (nextStyle: NavigationStyle) => {
        currentStyle = nextStyle;
        window.localStorage.setItem(storageKey, nextStyle);
        notify();
    };

    return { style, updateStyle };
}
