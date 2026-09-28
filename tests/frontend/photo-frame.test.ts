import assert from 'node:assert/strict';
import { test } from 'node:test';
import { singlePhotoHeight } from '../../resources/js/lib/photo-frame.ts';

const cap = '80svh, 44rem)';

void test('a lone photo keeps its own shape', () => {
    // 3:2 landscape and 1:1 square.
    assert.equal(singlePhotoHeight(1200, 800), `min(66.67cqw, ${cap}`);
    assert.equal(singlePhotoHeight(800, 800), `min(100.00cqw, ${cap}`);
    // A 9:16 phone portrait is as tall as its shape asks, up to the cap,
    // and shows whole with bands beside it past that.
    assert.equal(singlePhotoHeight(1080, 1920), `min(177.78cqw, ${cap}`);
});

void test('panoramas stop at 2:1 and show whole with bands', () => {
    assert.equal(singlePhotoHeight(4000, 1000), `min(50.00cqw, ${cap}`);
});

void test('a photo of unknown size starts at 16:10', () => {
    assert.equal(singlePhotoHeight(null, null), `min(62.50cqw, ${cap}`);
    assert.equal(singlePhotoHeight(undefined, 800), `min(62.50cqw, ${cap}`);
});
