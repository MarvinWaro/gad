import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    postsToRefresh,
    swapFreshPosts,
} from '../../resources/js/lib/live-posts.ts';

const shown = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

void test('only the posts the feed shows are asked for again', () => {
    assert.deepEqual(postsToRefresh({ ids: ['c', 'x', 'a'] }, shown), [
        'a',
        'c',
    ]);
    assert.deepEqual(postsToRefresh({ ids: ['x'] }, shown), []);
});

void test('after a dropped connection, every post shown is asked for', () => {
    assert.deepEqual(postsToRefresh(undefined, shown), ['a', 'b', 'c']);
    assert.deepEqual(postsToRefresh({ ids: 'a' }, shown), ['a', 'b', 'c']);
});

void test('fresh posts take their place; deleted ones leave; the rest stay as they are', () => {
    const current = [
        { id: 'a', comments: 1 },
        { id: 'b', comments: 2 },
        { id: 'c', comments: 3 },
    ];
    const next = swapFreshPosts(
        current,
        ['a', 'b'],
        [{ id: 'a', comments: 5 }],
    );

    assert.deepEqual(next, [
        { id: 'a', comments: 5 },
        { id: 'c', comments: 3 },
    ]);
    // Untouched cards keep their own object, so they do not reset.
    assert.equal(next[1], current[2]);
});
