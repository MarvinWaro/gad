import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    academicMonths,
    changeLabel,
    heatLevel,
    percentOf,
} from '../../resources/js/lib/dashboard.ts';

void test('a change reads against the period before, even from zero', () => {
    assert.equal(
        changeLabel({ value: 120, previous: 100 }, 'vs. August'),
        '+20.0% vs. August',
    );
    assert.equal(
        changeLabel({ value: 75, previous: 100 }, 'vs. August'),
        '-25.0% vs. August',
    );
    assert.equal(
        changeLabel({ value: 3, previous: 0 }, 'vs. AY 2025-2026'),
        'Up from 0 vs. AY 2025-2026',
    );
    assert.equal(
        changeLabel({ value: 0, previous: 0 }, 'vs. August'),
        'No change vs. August',
    );
});

void test('shares never divide by zero', () => {
    assert.equal(percentOf(38, 46), 83);
    assert.equal(percentOf(5, 0), 0);
});

void test('heat steps run from none to four, relative to the largest', () => {
    assert.equal(heatLevel(0, 12), 0);
    assert.equal(heatLevel(1, 12), 1);
    assert.equal(heatLevel(6, 12), 2);
    assert.equal(heatLevel(7, 12), 3);
    assert.equal(heatLevel(12, 12), 4);
    assert.equal(heatLevel(3, 0), 0);
});

void test('an academic year runs from August to July', () => {
    assert.deepEqual(
        academicMonths.map((month) => month.value),
        ['8', '9', '10', '11', '12', '1', '2', '3', '4', '5', '6', '7'],
    );
    assert.equal(academicMonths[0].label, 'August');
    assert.equal(academicMonths[11].label, 'July');
});
