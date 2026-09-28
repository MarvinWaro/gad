import { useEffect, useRef } from 'react';

/**
 * Tracks how far the middle of the window has travelled through an element,
 * from 0 (not reached) to 1 (passed its end, or the page scrolled to its
 * foot), as the `--scroll-progress` custom property on that element. It
 * writes the style directly, once per frame at most, so scrolling never
 * re-renders the component.
 */
export function useScrollProgress<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        let frame = 0;

        const update = () => {
            frame = 0;
            const box = element.getBoundingClientRect();
            const reached = window.innerHeight / 2 - box.top;
            // At the foot of the page the window's middle can stop short of
            // the element's end, so reaching the bottom counts as passing it.
            const atBottom =
                window.scrollY + window.innerHeight >=
                document.documentElement.scrollHeight - 1;
            const progress = atBottom
                ? 1
                : Math.min(1, Math.max(0, reached / box.height));
            element.style.setProperty('--scroll-progress', String(progress));
        };
        const schedule = () => {
            frame ||= requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, []);

    return ref;
}
