/**
 * The Virtual ID on a lanyard: a strap hanging from above its stage, with
 * the card clipped to its end, that swings when dragged and settles under
 * gravity. A few points joined by fixed lengths, moved by Verlet steps:
 * light enough for any phone, and it stops working once it is still. Pure,
 * so it can be tested without a browser; components/virtual-id-lanyard.tsx
 * draws it.
 */

export type Point = { x: number; y: number };

export type LanyardShape = {
    /** Where the strap hangs from, above the stage's top edge. */
    anchor: Point;
    /** The strap's length, from the anchor to the clip. */
    strap: number;
    segments: number;
    /** From the clip to the card's centre: half the card's height. */
    hang: number;
};

export type Lanyard = {
    shape: LanyardShape;
    /** The strap from the anchor to the clip, then the card's centre. */
    points: Point[];
    previous: Point[];
    /** Where the card's centre is held while someone drags it. */
    grab: Point | null;
};

/** One step, in seconds: run at a steady 60 a second, whatever the screen. */
export const STEP = 1 / 60;

/** In pixels a second squared, as a card on a strap feels at this size. */
const GRAVITY = 2400;
/** Each step keeps this much of its speed; the rest is air and friction. */
const DAMPING = 0.98;
const ITERATIONS = 12;
/** The fastest a card can be thrown, in pixels a second. */
const THROW = 900;
/** The card weighs as much as this many strap points. */
const CARD_WEIGHT = 4;
/** Below this many pixels a step, everywhere, it counts as still... */
const STILL = 0.02;
/** ...once every point is this close to straight under the anchor. */
const HANGING = 0.5;

function copy(points: Point[]): Point[] {
    return points.map((point) => ({ ...point }));
}

/** At rest: the strap straight down, the card hanging from its end. */
export function hangingLanyard(shape: LanyardShape): Lanyard {
    const length = shape.strap / shape.segments;
    const points = Array.from({ length: shape.segments + 1 }, (_, index) => ({
        x: shape.anchor.x,
        y: shape.anchor.y + index * length,
    }));
    const clip = points[points.length - 1];
    points.push({ x: clip.x, y: clip.y + shape.hang });

    return { shape, points, previous: copy(points), grab: null };
}

/** How far the card can be pulled: the strap and card, straight out. */
function reach(lanyard: Lanyard): number {
    return lanyard.shape.strap + lanyard.shape.hang;
}

/**
 * Hold the card's centre at `target`, as far as the strap lets it go, or
 * let it go (null): it keeps the speed it was moved at.
 */
export function grabCard(lanyard: Lanyard, target: Point | null): void {
    if (target === null) {
        // Let go, it keeps the speed it was moved at, short of a wild throw.
        const last = lanyard.points.length - 1;
        const centre = lanyard.points[last];
        const before = lanyard.previous[last];
        const dx = centre.x - before.x;
        const dy = centre.y - before.y;
        const speed = Math.hypot(dx, dy) / STEP;

        if (speed > THROW) {
            before.x = centre.x - (dx * THROW) / speed;
            before.y = centre.y - (dy * THROW) / speed;
        }

        lanyard.grab = null;

        return;
    }

    const { anchor } = lanyard.shape;
    const dx = target.x - anchor.x;
    const dy = target.y - anchor.y;
    const distance = Math.hypot(dx, dy);
    const limit = reach(lanyard) * 0.98;
    const scale = distance > limit ? limit / distance : 1;
    lanyard.grab = { x: anchor.x + dx * scale, y: anchor.y + dy * scale };
}

/** A sideways push on the card, in pixels a second. */
export function nudge(lanyard: Lanyard, speed: number): void {
    const centre = lanyard.previous[lanyard.previous.length - 1];
    centre.x -= speed * STEP;
}

/** Moves the lanyard on by one step. */
export function stepLanyard(lanyard: Lanyard): void {
    const { points, previous, shape } = lanyard;
    const last = points.length - 1;

    for (let index = 1; index <= last; index++) {
        const point = points[index];
        const before = previous[index];

        if (index === last && lanyard.grab) {
            before.x = point.x;
            before.y = point.y;
            point.x = lanyard.grab.x;
            point.y = lanyard.grab.y;
            continue;
        }

        const vx = (point.x - before.x) * DAMPING;
        const vy = (point.y - before.y) * DAMPING;
        before.x = point.x;
        before.y = point.y;
        point.x += vx;
        point.y += vy + GRAVITY * STEP * STEP;
    }

    const length = shape.strap / shape.segments;
    // How easily each point moves: the anchor never, the card least.
    const ease = (index: number) =>
        index === 0
            ? 0
            : index === last
              ? lanyard.grab
                  ? 0
                  : 1 / CARD_WEIGHT
              : 1;

    for (let round = 0; round < ITERATIONS; round++) {
        for (let index = 0; index < last; index++) {
            const a = points[index];
            const b = points[index + 1];
            const rest = index + 1 === last ? shape.hang : length;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 1e-6;
            const wa = ease(index);
            const wb = ease(index + 1);

            if (wa + wb === 0) {
                continue;
            }

            const correction = (distance - rest) / distance / (wa + wb);
            a.x += dx * correction * wa;
            a.y += dy * correction * wa;
            b.x -= dx * correction * wb;
            b.y -= dy * correction * wb;
        }
    }

    points[0].x = shape.anchor.x;
    points[0].y = shape.anchor.y;

    // A strap doesn't stretch: from the anchor down, nothing hangs further
    // than its length. Held, the hand decides instead.
    if (lanyard.grab) {
        return;
    }

    for (let index = 0; index < last; index++) {
        const a = points[index];
        const b = points[index + 1];
        const rest = index + 1 === last ? shape.hang : length;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);

        if (distance > rest) {
            b.x = a.x + (dx / distance) * rest;
            b.y = a.y + (dy / distance) * rest;
        }
    }
}

/**
 * Whether it has settled, so drawing can stop until someone touches it:
 * hanging straight down, not just pausing at the end of a swing.
 */
export function isStill(lanyard: Lanyard): boolean {
    const { anchor } = lanyard.shape;

    return (
        lanyard.grab === null &&
        lanyard.points.every(
            (point, index) =>
                Math.abs(point.x - anchor.x) < HANGING &&
                Math.abs(point.x - lanyard.previous[index].x) < STILL &&
                Math.abs(point.y - lanyard.previous[index].y) < STILL,
        )
    );
}

/**
 * Where to draw the card: its clip, its turn in degrees (clockwise, as CSS
 * turns), and how fast it swings sideways, in pixels a second.
 */
export function cardPose(lanyard: Lanyard): {
    clip: Point;
    rotation: number;
    swing: number;
} {
    const last = lanyard.points.length - 1;
    const clip = lanyard.points[last - 1];
    const centre = lanyard.points[last];
    const rotation =
        (-Math.atan2(centre.x - clip.x, centre.y - clip.y) * 180) / Math.PI;

    return {
        clip: { ...clip },
        rotation: Object.is(rotation, -0) ? 0 : rotation,
        swing: (centre.x - lanyard.previous[last].x) / STEP,
    };
}

/** The strap as a smooth SVG path, from the anchor to the clip. */
export function strapPath(lanyard: Lanyard): string {
    const strap = lanyard.points.slice(0, -1);
    const round = (value: number) => Math.round(value * 10) / 10;
    let path = `M${round(strap[0].x)} ${round(strap[0].y)}`;

    for (let index = 1; index < strap.length - 1; index++) {
        const point = strap[index];
        const next = strap[index + 1];
        path += `Q${round(point.x)} ${round(point.y)} ${round((point.x + next.x) / 2)} ${round((point.y + next.y) / 2)}`;
    }

    const end = strap[strap.length - 1];

    return `${path}L${round(end.x)} ${round(end.y)}`;
}
