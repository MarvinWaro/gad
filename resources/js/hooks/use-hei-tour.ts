import { router, useHttp, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef } from 'react';
import { firstName } from '@/components/hei/welcome-band';
import { heiTourSteps, visibleSteps } from '@/lib/hei-tour';
import { seen } from '@/routes/tour';

/** The first element named `target` (data-tour) that is on screen now. */
function onScreen(target: string): HTMLElement | null {
    for (const element of document.querySelectorAll<HTMLElement>(
        `[data-tour="${target}"]`,
    )) {
        if (
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden'
        ) {
            return element;
        }
    }

    return null;
}

/** Whether a dialog, sheet or menu is open, which the tour must not cover. */
function somethingOpen(): boolean {
    return (
        document.querySelector(
            '[role="dialog"][data-state="open"], [role="menu"][data-state="open"]',
        ) !== null
    );
}

/**
 * The HEI home's guided tour (lib/hei-tour.ts, docs in DESIGN.md). It
 * starts by itself while `pending` (the account never finished or closed
 * it), or when the address asks for it (?tour=1, from "Take the tour"),
 * then drops that from the address. However it ends, the server notes it,
 * so it never starts by itself again. driver.js loads only now.
 */
export function useHeiTour(pending: boolean): void {
    const { auth } = usePage().props;
    const url = usePage().url;
    const { submit } = useHttp();
    const running = useRef(false);
    const noted = useRef(!pending);
    // Asked for by a "Take the tour" link, until it starts.
    const asked = useRef(false);
    const name = firstName(auth.user.name);

    const start = useCallback(async () => {
        if (running.current) return;
        running.current = true;
        asked.current = false;

        const [{ driver }] = await Promise.all([
            import('driver.js'),
            import('driver.js/dist/driver.css'),
        ]);
        const steps = visibleSteps(
            heiTourSteps(name),
            (target) => onScreen(target) !== null,
        );
        const still = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        const tour = driver({
            steps: steps.map((step) => ({
                element: step.target
                    ? () => onScreen(step.target as string) ?? document.body
                    : undefined,
                popover: {
                    title: step.title,
                    description: step.description,
                    side: step.side,
                    align: 'start',
                },
            })),
            showProgress: true,
            progressText: '{{current}} of {{total}}',
            nextBtnText: 'Next',
            prevBtnText: 'Back',
            doneBtnText: 'Done',
            popoverClass: 'hei-tour',
            animate: !still,
            smoothScroll: !still,
            stagePadding: 6,
            stageRadius: 12,
            overlayColor: 'black',
            overlayOpacity: 0.5,
            // driver.js focuses the popover's first button, the close
            // button; Next is the one Enter should press.
            onPopoverRender: (popover) => {
                requestAnimationFrame(() =>
                    popover.nextButton.focus({ preventScroll: true }),
                );
            },
            onDestroyed: () => {
                running.current = false;
                if (!noted.current) {
                    noted.current = true;
                    void submit(seen()).catch(() => {
                        // Offline: it starts once more on the next visit.
                        noted.current = false;
                    });
                }
            },
        });

        tour.drive();
    }, [name, submit]);

    useEffect(() => {
        if (new URLSearchParams(url.split('?')[1] ?? '').has('tour')) {
            asked.current = true;
            // The link did its job; a reload shouldn't start it again.
            const clean = new URL(window.location.href);
            clean.searchParams.delete('tour');
            router.replace({
                url: clean.pathname + clean.search + clean.hash,
                preserveScroll: true,
                preserveState: true,
            });
        }

        if (!asked.current && (!pending || noted.current)) return;

        // Once the page has settled, and never over a dialog.
        const timer = window.setTimeout(() => {
            if (!somethingOpen()) void start();
        }, 700);

        return () => window.clearTimeout(timer);
    }, [url, pending, start]);
}
