import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    achieveAgenda,
    achieveItemsFor,
} from '../../resources/js/data/achieve.ts';
import { sdgsFor, sustainableGoals } from '../../resources/js/data/sdgs.ts';
import {
    badgeShare,
    badgeSize,
    goalsSummary,
    MAX_SDGS,
    MIN_BADGE,
    toggleWithin,
} from '../../resources/js/lib/post-goals.ts';

void test('the 17 goals and 7 agenda codes match App\\Enums', () => {
    assert.deepEqual(
        sustainableGoals.map((goal) => goal.number),
        Array.from({ length: 17 }, (_, index) => index + 1),
    );
    assert.deepEqual(
        achieveAgenda.map((item) => item.code),
        [
            'lifelong-learning',
            'human-capital',
            'research-innovation',
            'internationalization',
            'data-analytics',
            'governance',
            'public-service',
        ],
    );
    assert.equal(achieveAgenda.map((item) => item.letter).join(''), 'ACHIEVE');
});

void test('icons shrink as the row fills, and the full row stays within a third of the photo', () => {
    const rows = [
        [1, false],
        [2, false],
        [3, false],
        [1, true],
        [2, true],
        [3, true],
    ] as const;
    const shares = rows.map(([count, agenda]) => badgeShare(count, agenda));

    for (let index = 1; index < shares.length; index++) {
        assert.ok(shares[index] < shares[index - 1], `row ${index} shrinks`);
    }

    assert.equal(badgeShare(1, false), 9.5);
    // Three icons plus the strip (about 2.8 icons wide).
    assert.ok(badgeShare(MAX_SDGS, true) * (MAX_SDGS + 2.8) <= 35);
    assert.equal(badgeSize(1, false), `clamp(${MIN_BADGE}px, 9.50cqw, 72px)`);
});

void test('goals and agenda items come back in their official order', () => {
    assert.deepEqual(
        sdgsFor([10, 5, 4]).map((goal) => goal.number),
        [4, 5, 10],
    );
    assert.deepEqual(
        achieveItemsFor(['public-service', 'lifelong-learning']).map(
            (item) => item.letter,
        ),
        ['A', 'E'],
    );
});

void test('the summary names every goal and agenda item', () => {
    assert.equal(
        goalsSummary(sdgsFor([4, 5]), achieveItemsFor(['lifelong-learning'])),
        'Goal 4: Quality Education, Goal 5: Gender Equality, and A.C.H.I.E.V.E. A: Advanced and Accessible Lifelong Learning',
    );
    assert.equal(goalsSummary(sdgsFor([5]), []), 'Goal 5: Gender Equality');
});

void test('picking stops at the limit, and picking again removes', () => {
    assert.deepEqual(toggleWithin([4, 5], 10, 3), [4, 5, 10]);
    assert.deepEqual(toggleWithin([4, 5, 10], 1, 3), [4, 5, 10]);
    assert.deepEqual(toggleWithin([4, 5, 10], 5, 3), [4, 10]);
});
