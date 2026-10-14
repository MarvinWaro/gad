import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import {
    cardPose,
    grabCard,
    hangingLanyard,
    isStill,
    nudge,
    STEP,
    stepLanyard,
    strapPath,
} from '@/lib/lanyard';
import type { Lanyard } from '@/lib/lanyard';
import { CARD_RATIO } from '@/lib/virtual-id';
import { cn } from '@/lib/utils';

/** A tap, not a drag: it barely moved, and not for long. */
const TAP = { distance: 6, ms: 350 };

/** The strap's words, over and over, as on a printed lanyard. */
const STRAP_TEXT = Array.from({ length: 8 }, () => 'PHLGADIS').join('  ·  ');

/**
 * The Virtual ID hanging from a lanyard (lib/lanyard.ts): drag the card to
 * swing it, tap it to turn it over. It settles hanging straight, as staff
 * scan it, and it stays still for people who ask for less motion. The
 * strap and clip are drawn over the card; each frame moves them and the
 * card directly, without rendering React again.
 */
export function VirtualIdLanyard({
    front,
    back,
    flipped,
    onTap,
}: {
    /** The card's face, with the QR. */
    front: ReactNode;
    back: ReactNode;
    flipped: boolean;
    onTap: () => void;
}) {
    // A plain id for the strap's path, which its words follow.
    const strapId = `strap-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
    const stage = useRef<HTMLDivElement>(null);
    const strap = useRef<SVGPathElement>(null);
    const clip = useRef<SVGGElement>(null);
    const body = useRef<HTMLDivElement>(null);
    const turn = useRef<HTMLDivElement>(null);
    const tap = useRef(onTap);

    useEffect(() => {
        tap.current = onTap;
    }, [onTap]);

    useEffect(() => {
        const area = stage.current;
        const card = body.current;

        if (!area || !card) {
            return;
        }

        const still = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        let lanyard: Lanyard | null = null;
        let width = 0;
        let frame = 0;
        let running = false;
        let last = 0;
        let spare = 0;
        let hold: {
            pointer: number;
            offset: { x: number; y: number };
            start: { x: number; y: number };
            at: number;
            moved: boolean;
        } | null = null;

        function draw() {
            if (!lanyard || !card) {
                return;
            }

            const pose = cardPose(lanyard);
            strap.current?.setAttribute('d', strapPath(lanyard));
            clip.current?.setAttribute(
                'transform',
                `translate(${pose.clip.x} ${pose.clip.y}) rotate(${pose.rotation})`,
            );
            card.style.transform = `translate(${pose.clip.x - width / 2}px, ${pose.clip.y}px) rotate(${pose.rotation}deg)`;

            if (turn.current) {
                // A swinging card turns a little towards where it is going.
                const yaw = Math.max(-28, Math.min(28, pose.swing * 0.025));
                turn.current.style.transform = `rotateY(${yaw}deg)`;
            }
        }

        function tick(time: number) {
            if (!lanyard) {
                return;
            }

            spare += Math.min(0.1, (time - last) / 1000);
            last = time;

            while (spare >= STEP) {
                stepLanyard(lanyard);
                spare -= STEP;
            }

            draw();

            if (isStill(lanyard)) {
                running = false;

                return;
            }

            frame = requestAnimationFrame(tick);
        }

        function wake() {
            if (still || running) {
                draw();

                return;
            }

            running = true;
            last = performance.now();
            spare = 0;
            frame = requestAnimationFrame(tick);
        }

        function measure() {
            if (!area || !card) {
                return;
            }

            const size = area.getBoundingClientRect();
            width = size.width < 420 ? 200 : 236;
            card.style.width = `${width}px`;
            const height = width * CARD_RATIO;
            lanyard = hangingLanyard({
                anchor: { x: size.width / 2, y: -24 },
                strap: Math.max(80, size.height - height - 28 + 24),
                segments: 10,
                hang: height / 2,
            });
            draw();
        }

        function local(event: PointerEvent) {
            const box = area!.getBoundingClientRect();

            return { x: event.clientX - box.left, y: event.clientY - box.top };
        }

        function down(event: PointerEvent) {
            if (!lanyard || event.button > 0) {
                return;
            }

            const at = local(event);
            const centre = lanyard.points[lanyard.points.length - 1];
            hold = {
                pointer: event.pointerId,
                offset: { x: at.x - centre.x, y: at.y - centre.y },
                start: at,
                at: performance.now(),
                moved: false,
            };
            card!.setPointerCapture(event.pointerId);
        }

        function move(event: PointerEvent) {
            if (!lanyard || !hold || event.pointerId !== hold.pointer) {
                return;
            }

            const at = local(event);

            if (
                Math.hypot(at.x - hold.start.x, at.y - hold.start.y) >
                TAP.distance
            ) {
                hold.moved = true;
            }

            if (hold.moved && !still) {
                grabCard(lanyard, {
                    x: at.x - hold.offset.x,
                    y: at.y - hold.offset.y,
                });
                wake();
            }
        }

        function up(event: PointerEvent) {
            if (!lanyard || !hold || event.pointerId !== hold.pointer) {
                return;
            }

            const tapped = !hold.moved && performance.now() - hold.at < TAP.ms;
            hold = null;
            grabCard(lanyard, null);
            wake();

            if (tapped) {
                tap.current();
            }
        }

        function cancel() {
            hold = null;

            if (lanyard) {
                grabCard(lanyard, null);
                wake();
            }
        }

        measure();
        const observer = new ResizeObserver(() => {
            measure();
            wake();
        });
        observer.observe(area);
        card.addEventListener('pointerdown', down);
        card.addEventListener('pointermove', move);
        card.addEventListener('pointerup', up);
        card.addEventListener('pointercancel', cancel);

        // A small swing as it arrives, so it reads as something to touch.
        if (!still && lanyard) {
            nudge(lanyard, 520);
            wake();
        }

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            card.removeEventListener('pointerdown', down);
            card.removeEventListener('pointermove', move);
            card.removeEventListener('pointerup', up);
            card.removeEventListener('pointercancel', cancel);
        };
    }, []);

    return (
        <div
            ref={stage}
            className="relative h-[480px] overflow-hidden rounded-xl border bg-muted/40 sm:h-[540px]"
        >
            <div
                ref={body}
                className="absolute top-0 left-0 origin-top cursor-grab touch-none select-none active:cursor-grabbing"
                style={{ perspective: '900px' }}
            >
                <div ref={turn} className="transform-3d">
                    <div
                        className={cn(
                            'relative transform-3d motion-safe:transition-transform motion-safe:duration-700',
                            flipped && 'rotate-y-180',
                        )}
                    >
                        <div className="backface-hidden">{front}</div>
                        <div
                            aria-hidden
                            className="absolute inset-0 rotate-y-180 backface-hidden"
                        >
                            {back}
                        </div>
                    </div>
                </div>
            </div>
            <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full overflow-visible"
            >
                <path
                    id={strapId}
                    ref={strap}
                    fill="none"
                    className="stroke-paper-accent"
                    strokeWidth={18}
                    strokeLinecap="round"
                />
                <text
                    className="fill-white"
                    fontSize={9}
                    fontWeight={600}
                    letterSpacing={2}
                    dy={3.2}
                >
                    <textPath href={`#${strapId}`} startOffset={6}>
                        {STRAP_TEXT}
                    </textPath>
                </text>
                <g ref={clip}>
                    <rect
                        x={-11}
                        y={-16}
                        width={22}
                        height={26}
                        rx={5}
                        className="fill-muted-foreground"
                    />
                    <rect
                        x={-6}
                        y={-4}
                        width={12}
                        height={4}
                        rx={2}
                        className="fill-background"
                    />
                </g>
            </svg>
        </div>
    );
}
