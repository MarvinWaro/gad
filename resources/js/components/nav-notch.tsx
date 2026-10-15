import { useLayoutEffect, useRef } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';

/**
 * The open page's sidebar item as a tab of the page itself: a panel the
 * colour of the page reaches from the active NavMain item (`data-notch`)
 * into the content panel, with concave corners where they meet, and slides
 * to the next item on navigation. Only on the full desktop sidebar; the
 * icon rail and the phone menu keep the cream pill.
 */
export function NavNotch() {
    const { state, isMobile } = useSidebar();
    const { currentUrl } = useCurrentUrl();
    const notch = useRef<HTMLSpanElement>(null);
    const placed = useRef(false);

    useLayoutEffect(() => {
        const tab = notch.current;
        // The sidebar's fixed frame: the tab is placed against its edges.
        const frame = tab?.offsetParent;
        if (!tab || !(frame instanceof HTMLElement)) return;
        const content = frame.querySelector<HTMLElement>(
            '[data-sidebar="content"]',
        );
        let pending = 0;

        const hide = () => {
            tab.dataset.hidden = '';
            placed.current = false;
        };

        const place = () => {
            pending = 0;
            const item = frame.querySelector<HTMLElement>(
                '[data-notch][data-active="true"]',
            );
            if (state !== 'expanded' || isMobile || !item) {
                hide();
                return;
            }

            const box = frame.getBoundingClientRect();
            const target = item.getBoundingClientRect();
            const view = content?.getBoundingClientRect();
            // Scrolled out of the list: no tab rather than one over the header.
            if (
                view &&
                (target.top < view.top || target.bottom > view.bottom)
            ) {
                hide();
                return;
            }

            // The first placement lands at once; later ones slide.
            if (!placed.current) tab.dataset.instant = '';
            tab.style.setProperty('--notch-y', `${target.top - box.top}px`);
            tab.style.setProperty('--notch-x', `${target.left - box.left}px`);
            tab.style.setProperty('--notch-height', `${target.height}px`);
            delete tab.dataset.hidden;
            if (!placed.current) {
                placed.current = true;
                requestAnimationFrame(() => delete tab.dataset.instant);
            }
        };
        const schedule = () => {
            pending ||= requestAnimationFrame(place);
        };

        schedule();
        content?.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        // The sidebar widening or a group's items changing moves the item.
        const resizeWatch = new ResizeObserver(schedule);
        if (content) resizeWatch.observe(content);

        return () => {
            cancelAnimationFrame(pending);
            content?.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
            resizeWatch.disconnect();
        };
    }, [currentUrl, state, isMobile]);

    return (
        <span
            ref={notch}
            aria-hidden="true"
            className="nav-notch"
            data-hidden=""
        />
    );
}
