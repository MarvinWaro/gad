import assert from 'node:assert/strict';
import { test } from 'node:test';
import { averageRgb, bandColor } from '../../resources/js/lib/photo-tint.ts';

void test('the band takes the average colour of the photo’s foot', () => {
    assert.deepEqual(
        averageRgb([255, 0, 0, 255, 0, 0, 255, 255]),
        [128, 0, 128],
    );
});

void test('see-through pixels do not darken it, and an empty strip has none', () => {
    assert.deepEqual(
        averageRgb([240, 120, 40, 255, 0, 0, 0, 0]),
        [240, 120, 40],
    );
    assert.equal(averageRgb([10, 10, 10, 0]), null);
});

void test('the band keeps the photo’s hue, richer and deep enough for the badges', () => {
    // A pale orange foot becomes a deep, rich orange.
    assert.equal(bandColor([240, 180, 120]), 'hsl(30 100% 42%)');
    // A grey foot stays grey, darkened; a black poster stays neutral too.
    assert.equal(bandColor([200, 200, 200]), 'hsl(0 0% 42%)');
    assert.equal(bandColor([5, 5, 5]), 'hsl(0 0% 22%)');
});
