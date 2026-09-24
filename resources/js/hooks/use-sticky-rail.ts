import { useEffect, useRef } from 'react';

/**
 * Keeps a side rail in view beside a long feed without ever clipping it.
 *
 * A rail that fits the viewport simply sticks `top` px below the page top.
 * A taller rail scrolls with the page until its end is visible, then holds
 * there; scrolling back up brings its top back the same way. The element
 * needs `position: sticky` and must not stretch (e.g. `self-start` in grid).
 */
export function useStickyRail<T extends HTMLElement>({
    top,
    bottom,
}: {
    top: number;
    bottom: number;
}) {
    const ref = useRef<T>(null);

    useEffect(() => {
        const rail = ref.current;

        if (!rail) {
            return;
        }

        let offset = top;
        let lastScrollY = window.scrollY;
        let frame = 0;

        const update = () => {
            frame = 0;
            const lowest = Math.min(
                top,
                window.innerHeight - rail.offsetHeight - bottom,
            );
            const scrolled = window.scrollY - lastScrollY;
            lastScrollY = window.scrollY;
            offset = Math.min(top, Math.max(lowest, offset - scrolled));
            rail.style.top = `${offset}px`;
        };

        const schedule = () => {
            if (!frame) {
                frame = requestAnimationFrame(update);
            }
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        // The calendar changes height between months; posts load in below.
        const observer = new ResizeObserver(schedule);
        observer.observe(rail);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            observer.disconnect();
        };
    }, [top, bottom]);

    return ref;
}
