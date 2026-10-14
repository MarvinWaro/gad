import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    cardPose,
    grabCard,
    hangingLanyard,
    isStill,
    nudge,
    stepLanyard,
    strapPath,
} from '../../resources/js/lib/lanyard.ts';
import {
    CARD_RATIO,
    layoutCardBack,
} from '../../resources/js/lib/virtual-id.ts';
import type { Measure } from '../../resources/js/lib/virtual-id.ts';

const shape = {
    anchor: { x: 200, y: -24 },
    strap: 200,
    segments: 10,
    hang: 180,
};

function run(steps: number, lanyard = hangingLanyard(shape)) {
    for (let index = 0; index < steps; index++) {
        stepLanyard(lanyard);
    }

    return lanyard;
}

void test('at rest the card hangs straight under the anchor, and stays still', () => {
    const lanyard = run(120);
    const pose = cardPose(lanyard);

    assert.ok(Math.abs(pose.clip.x - 200) < 0.5);
    assert.ok(Math.abs(pose.rotation) < 0.5);
    assert.ok(Math.abs(pose.clip.y - (-24 + 200)) < 1);
    assert.ok(isStill(lanyard));
});

void test('a push swings the card, and it settles again without help', () => {
    const lanyard = hangingLanyard(shape);
    nudge(lanyard, 900);
    run(10, lanyard);
    assert.ok(Math.abs(cardPose(lanyard).rotation) > 2);
    assert.ok(!isStill(lanyard));

    run(60 * 20, lanyard);
    assert.ok(isStill(lanyard));
    assert.ok(Math.abs(cardPose(lanyard).rotation) < 0.5);
});

void test('a dragged card follows the hand, never past the strap, and keeps its speed when let go', () => {
    const lanyard = hangingLanyard(shape);
    grabCard(lanyard, { x: 5000, y: 0 });
    run(30, lanyard);
    const centre = lanyard.points[lanyard.points.length - 1];
    const reach = Math.hypot(centre.x - 200, centre.y + 24);

    assert.ok(reach <= shape.strap + shape.hang + 1);
    assert.ok(!isStill(lanyard));

    // A wild fling is let go at a throw a person could make.
    grabCard(lanyard, { x: 200, y: 600 });
    stepLanyard(lanyard);
    grabCard(lanyard, null);
    assert.ok(Math.abs(cardPose(lanyard).swing) <= 900);
    run(1, lanyard);
    assert.ok(!isStill(lanyard));
});

void test('the strap is one smooth path from the anchor to the clip', () => {
    const lanyard = hangingLanyard(shape);
    const path = strapPath(lanyard);

    assert.match(path, /^M200 -24(Q[\d. -]+)+L200 176$/);
});

void test('the back of the card has the mark, the system, the name and where to show it', () => {
    const measure: Measure = (text, font) =>
        text.length * Number(/([\d.]+)px/u.exec(font)?.[1] ?? 0) * 0.5;
    const layout = layoutCardBack(
        'Ma. Concepcion Bernadette Dela Cruz-Villanueva III',
        320,
        { sans: 'sans-serif', mono: 'monospace' },
        measure,
    );

    assert.equal(Math.round(layout.height), Math.round(320 * CARD_RATIO));
    assert.ok(layout.title.lines.length >= 2);
    assert.ok(layout.name.lines.length >= 1);
    // Top to bottom, nothing overlaps, and the hint stays above the wave.
    const bottom = (block: {
        top: number;
        size: number;
        lineHeight: number;
        lines: string[];
    }) => block.top + block.lines.length * block.size * block.lineHeight;
    assert.ok(layout.mark.y + layout.mark.size < layout.brand.top);
    assert.ok(bottom(layout.title) < layout.rule.y);
    assert.ok(bottom(layout.name) < layout.hint.top);
    assert.ok(bottom(layout.hint) <= layout.height - layout.foot);
});
