import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HerstoryEntry } from '@/data/herstory';
import { focusOf, smoothstep, stopAt } from '@/lib/scroll-scenes';

// Three.js comes in its own chunk, only when the section is near.
const HerstoryFlightCanvas = lazy(() => import('./herstory-flight-canvas'));

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * The GAD Herstory timeline as a flight: while the stage is pinned under
 * the header, scrolling flies the camera along a dotted route past one card
 * per milestone, and that milestone's caption shows. The captions are the
 * whole timeline in one list, so screen readers read every milestone; the
 * canvas only illustrates them. `onUnavailable` is called if WebGL fails
 * after all, so the page can show the still timeline instead.
 */
export function HerstoryFlight({
    entries,
    animate,
    onUnavailable,
}: {
    entries: HerstoryEntry[];
    /** False until the page knows the device can run the scene. */
    animate: boolean;
    onUnavailable: () => void;
}) {
    const section = useRef<HTMLElement>(null);
    const stage = useRef<HTMLDivElement>(null);
    const art = useRef<HTMLDivElement>(null);
    const captions = useRef<HTMLOListElement>(null);
    const rail = useRef<HTMLDivElement>(null);
    /** Where the camera is, from 0 to the last stop, eased toward the scroll. */
    const at = useRef(0);
    const [near, setNear] = useState(false);

    // Mount the canvas a screen before the section arrives.
    useEffect(() => {
        const element = section.current;
        if (!element) return;
        const observer = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setNear(true),
            { rootMargin: '100% 0px' },
        );
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    // Follow the scroll: ease `at` toward it and show the captions and the
    // rail in step. It runs only while the scroll is moving or settling,
    // and writes only what changed, so it never re-renders.
    useEffect(() => {
        const element = section.current;
        const pinned = stage.current;
        const list = captions.current;
        const track = rail.current;
        if (!element || !pinned || !list || !track) return;

        const items = [...list.children] as HTMLElement[];
        const ticks = [...track.children] as HTMLElement[];
        const stops = items.length;
        const shown = items.map(() => -1);
        let current = -1;
        let stickyTop = 0;
        let travel = 1;
        let frame = 0;
        let last = 0;
        let started = false;

        const measure = () => {
            stickyTop = parseFloat(getComputedStyle(pinned).top) || 0;
            travel = Math.max(1, element.offsetHeight - pinned.offsetHeight);
        };
        const goal = () =>
            stopAt(
                (stickyTop - element.getBoundingClientRect().top) / travel,
                stops,
            );

        const paint = () => {
            items.forEach((item, index) => {
                const opacity =
                    Math.round(focusOf(at.current, index) * 1000) / 1000;
                if (opacity === shown[index]) return;
                shown[index] = opacity;
                item.style.setProperty('--o', String(opacity));
                // Captions rise into place and leave upward.
                const rise = (at.current < index ? 1 : -1) * 24 * (1 - opacity);
                item.style.setProperty('--y', `${rise.toFixed(1)}px`);
            });
            const step = Math.round(at.current);
            if (step !== current) {
                items[current]?.classList.remove('is-current');
                ticks[current]?.classList.remove('is-current');
                current = step;
                items[current]?.classList.add('is-current');
                ticks[current]?.classList.add('is-current');
            }
            pinned.style.setProperty(
                '--flight-progress',
                (at.current / Math.max(1, stops - 1)).toFixed(4),
            );
            pinned.style.setProperty(
                '--flight-hint',
                (1 - smoothstep(0.02, 0.3, at.current)).toFixed(3),
            );
        };

        const tick = (now: number) => {
            frame = 0;
            const target = goal();
            // Coming back to the page mid-way starts there, not at the top.
            if (!started) {
                started = true;
                at.current = target;
            } else {
                const dt = Math.min(0.1, (now - last) / 1000);
                at.current += (target - at.current) * (1 - Math.exp(-dt * 6));
                if (Math.abs(target - at.current) < 0.0005) at.current = target;
            }
            last = now;
            paint();
            if (at.current !== target) frame = requestAnimationFrame(tick);
        };
        const schedule = () => {
            frame ||= requestAnimationFrame(tick);
        };

        measure();
        tick(performance.now());
        const sizeWatch = new ResizeObserver(() => {
            measure();
            schedule();
        });
        sizeWatch.observe(element);
        sizeWatch.observe(pinned);
        window.addEventListener('scroll', schedule, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            sizeWatch.disconnect();
            window.removeEventListener('scroll', schedule);
        };
    }, []);

    return (
        <section
            ref={section}
            className="flight"
            aria-label="Milestones"
            style={{ '--flight-stops': entries.length } as CSSProperties}
        >
            <div ref={stage} className="flight-stage">
                {animate && near && (
                    <Suspense fallback={null}>
                        <HerstoryFlightCanvas
                            entries={entries}
                            at={at}
                            stage={stage}
                            art={art}
                            onUnavailable={onUnavailable}
                        />
                    </Suspense>
                )}
                <div className="flight-inner">
                    <div ref={art} className="flight-art" aria-hidden="true" />
                    <ol ref={captions} className="flight-captions">
                        {entries.map((entry, index) => (
                            <li key={entry.id} className="flight-caption">
                                <p className="flight-eyebrow">
                                    <span aria-hidden="true">
                                        {pad(index + 1)} / {pad(entries.length)}
                                    </span>
                                    <time dateTime={entry.datetime}>
                                        {entry.date}
                                    </time>
                                </p>
                                <h2>{entry.title}</h2>
                                <p>
                                    {entry.lines.map((line, lineIndex) => (
                                        <Fragment key={lineIndex}>
                                            {lineIndex > 0 && <br />}
                                            {line}
                                        </Fragment>
                                    ))}
                                </p>
                                {entry.image && (
                                    <p className="sr-only">{entry.image.alt}</p>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
                <div ref={rail} className="flight-rail" aria-hidden="true">
                    {entries.map((entry, index) => (
                        <i
                            key={entry.id}
                            style={{ '--i': index } as CSSProperties}
                        />
                    ))}
                </div>
                <p className="flight-hint" aria-hidden="true">
                    Scroll
                    <ChevronDown />
                </p>
            </div>
        </section>
    );
}
