import { router } from '@inertiajs/react';
import { useEffect } from 'react';

// Inertia rebuilds a page from its history entry on Back and Forward, so the
// props are the ones the page had when it was left. Note when the browser
// moves through history (or the whole document was loaded that way), and
// forget it as soon as an ordinary visit starts.
let cameFromHistory = false;

if (typeof window !== 'undefined') {
    const entry = window.performance?.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
    cameFromHistory = entry?.type === 'back_forward';

    window.addEventListener('popstate', () => {
        cameFromHistory = true;
    });
    router.on('start', () => {
        cameFromHistory = false;
    });
}

/** Fetch fresh props when the page is reached with the browser's Back or Forward. */
export function useReloadOnBack(): void {
    useEffect(() => {
        if (cameFromHistory) {
            cameFromHistory = false;
            router.reload();
        }
    }, []);
}
