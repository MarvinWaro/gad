import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    applyReaction,
    POST_REACTIONS,
    REACTORS_SHOWN,
    reactionsLabel,
    usedReactions,
} from '../../resources/js/lib/post-reactions.ts';
import type {
    ReactionSummary,
    ReactorRef,
} from '../../resources/js/types/community.ts';

const viewer = { id: 1, name: 'Ana Cruz' };

function summary(overrides: Partial<ReactionSummary> = {}): ReactionSummary {
    return {
        total: 0,
        counts: { heart: 0, care: 0, clap: 0 },
        mine: null,
        recent: [],
        ...overrides,
    };
}

void test('the reaction codes match App\\Enums\\PostReactionType', () => {
    assert.deepEqual(
        POST_REACTIONS.map((reaction) => reaction.value),
        ['heart', 'care', 'clap'],
    );
});

void test('reacting adds the viewer first; changing moves the count; taking it back removes them', () => {
    const other: ReactorRef = { id: 2, name: 'Ben Reyes', type: 'care' };
    const hearted = applyReaction(
        summary({
            total: 1,
            counts: { heart: 0, care: 1, clap: 0 },
            recent: [other],
        }),
        'heart',
        viewer,
    );

    assert.deepEqual(hearted, {
        total: 2,
        counts: { heart: 1, care: 1, clap: 0 },
        mine: 'heart',
        recent: [{ ...viewer, type: 'heart' }, other],
    });

    const clapped = applyReaction(hearted, 'clap', viewer);

    assert.equal(clapped.total, 2);
    assert.deepEqual(clapped.counts, { heart: 0, care: 1, clap: 1 });
    assert.deepEqual(clapped.recent, [{ ...viewer, type: 'clap' }, other]);

    const removed = applyReaction(clapped, null, viewer);

    assert.equal(removed.total, 1);
    assert.equal(removed.mine, null);
    assert.deepEqual(removed.counts, { heart: 0, care: 1, clap: 0 });
    assert.deepEqual(removed.recent, [other]);
});

void test('the tooltip keeps at most ten names', () => {
    const recent: ReactorRef[] = Array.from(
        { length: REACTORS_SHOWN },
        (_, index) => ({
            id: index + 2,
            name: `Person ${index}`,
            type: 'heart',
        }),
    );
    const next = applyReaction(
        summary({ total: 40, counts: { heart: 40, care: 0, clap: 0 }, recent }),
        'care',
        viewer,
    );

    assert.equal(next.recent.length, REACTORS_SHOWN);
    assert.equal(next.recent[0].id, viewer.id);
    assert.equal(next.total, 41);
});

void test('reactions are listed most given first, ties in picker order', () => {
    const counts = { heart: 2, care: 5, clap: 2 };

    assert.deepEqual(usedReactions(summary({ total: 9, counts })), [
        'care',
        'heart',
        'clap',
    ]);
    assert.deepEqual(
        usedReactions(
            summary({ total: 1, counts: { heart: 0, care: 0, clap: 1 } }),
        ),
        ['clap'],
    );
    assert.equal(
        reactionsLabel(summary({ total: 9, counts })),
        '9 reactions: 5 Care, 2 Heart, 2 Clap',
    );
    assert.equal(
        reactionsLabel(
            summary({ total: 1, counts: { heart: 1, care: 0, clap: 0 } }),
        ),
        '1 reaction: 1 Heart',
    );
});
