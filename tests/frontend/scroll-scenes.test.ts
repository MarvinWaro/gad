import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    focusOf,
    stopAt,
    viewFraming,
    weavingRoute,
} from '../../resources/js/lib/scroll-scenes.ts';

const close = (actual: number, expected: number, tolerance = 1e-6) =>
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `${actual} is not ${expected}`,
    );

void test('the route runs away from the viewer, a point a stop and one at each end, weaving within its sway', () => {
    const route = weavingRoute(13, { spacing: 6, swayX: 2.2, swayY: 0.35 });

    assert.equal(route.length, 15);
    route.forEach(([x, y, z], index) => {
        assert.equal(z, -index * 6);
        assert.ok(Math.abs(x) <= 2.2 && Math.abs(y) <= 0.35);
    });
    // The same every visit.
    assert.deepEqual(
        route,
        weavingRoute(13, { spacing: 6, swayX: 2.2, swayY: 0.35 }),
    );
});

void test('scrolling runs from the first stop to the last, never back, and holds at each stop', () => {
    assert.equal(stopAt(0, 13), 0);
    assert.equal(stopAt(1, 13), 12);
    assert.equal(stopAt(-0.5, 13), 0);
    assert.equal(stopAt(1.5, 13), 12);
    assert.equal(stopAt(0.5, 1), 0);

    let previous = -1;
    for (let step = 0; step <= 1000; step++) {
        const at = stopAt(step / 1000, 13);
        assert.ok(at >= previous);
        previous = at;
    }

    // A fifth of a step either side of a stop stays on it.
    const step = 1 / 12;
    assert.equal(stopAt(3 * step + step * 0.19, 13), 3);
    assert.equal(stopAt(3 * step - step * 0.19, 13), 3);
    close(stopAt(3.5 * step, 13), 3.5);
});

void test('a stop is fully in step at itself and gone half a stop away', () => {
    assert.equal(focusOf(4, 4), 1);
    assert.equal(focusOf(4.05, 4), 1);
    assert.equal(focusOf(4.5, 4), 0);
    assert.equal(focusOf(3.5, 4), 0);
    assert.ok(focusOf(4.3, 4) > 0 && focusOf(4.3, 4) < 1);
});

const subject = { width: 1.92, height: 1.32, distance: 4.15 };
const fill = { width: 0.8, height: 0.5 };

/** Where the centre of view lands, and how big a pixel is at the card. */
function project(frame: ReturnType<typeof viewFraming>) {
    return {
        x: frame.fullWidth / 2 - frame.offsetX,
        y: frame.fullHeight / 2 - frame.offsetY,
        // Scene units a pixel at the subject's distance.
        unit:
            (2 * subject.distance * Math.tan((frame.fov * Math.PI) / 360)) /
            frame.fullHeight,
    };
}

void test('on a wide screen the scene is centred on the art box beside the caption, and the card fits it', () => {
    const stage = { width: 1440, height: 812 };
    const art = { left: 586, top: 0, width: 774, height: 812 };
    const frame = viewFraming(stage, art, subject, fill);
    const view = project(frame);

    close(view.x, art.left + art.width / 2);
    close(view.y, art.top + art.height / 2);
    assert.ok(subject.width / view.unit <= art.width * fill.width + 1e-6);
    assert.ok(subject.height / view.unit <= art.height * fill.height + 1e-6);
    // One of the two limits is what sets the size.
    assert.ok(
        Math.abs(subject.width / view.unit - art.width * fill.width) < 1e-6 ||
            Math.abs(subject.height / view.unit - art.height * fill.height) <
                1e-6,
    );
});

void test('on a 360px phone upright the card is framed in the top half, within its width', () => {
    const stage = { width: 360, height: 600 };
    const art = { left: 0, top: 24, width: 328, height: 276 };
    const frame = viewFraming(stage, art, subject, fill);
    const view = project(frame);

    close(view.x, 164);
    close(view.y, 162);
    assert.ok(subject.width / view.unit <= 328 * 0.8 + 1e-6);
    assert.ok(subject.height / view.unit <= 276 * 0.5 + 1e-6);
    assert.ok(frame.fov > 0 && frame.fov < 120);
});
