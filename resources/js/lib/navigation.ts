import { router } from '@inertiajs/react';

/** The page visits under way: going to another page, not reloads or prefetches. */
const visits = new Set<string>();

if (typeof window !== 'undefined') {
    router.on('start', (event) => {
        const { visit } = event.detail;

        if (!visit.async && !visit.prefetch) {
            visits.add(visit.id);
        }
    });
    // Cancelled and interrupted visits finish too.
    router.on('finish', (event) => {
        visits.delete(event.detail.visit.id);
    });
}

/**
 * Whether the browser is on its way to another page. Live updates hold off
 * meanwhile: changing the current page's props while the next page's code is
 * still loading makes Inertia drop the next page, so a click "loads" and goes
 * nowhere. The page arriving brings its own fresh props anyway.
 */
export function isNavigating(): boolean {
    return visits.size > 0;
}
