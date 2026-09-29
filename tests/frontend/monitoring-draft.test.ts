import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    applySaveResult,
    editField,
    initDraft,
    mergeSnapshot,
    pendingPayload,
    resolveConflict,
    stageOf,
    valueOf,
} from '../../resources/js/lib/monitoring-draft.ts';
import type {
    MonitoringReport,
    MonitoringRevision,
} from '../../resources/js/types/monitoring.ts';

function revision(answers: Record<string, string> = {}): MonitoringRevision {
    return {
        id: 'r1',
        number: 1,
        template_version: '2025',
        details: {
            address: '',
            accomplished_on: '',
            president_name: '',
            focal_person_name: '',
        },
        answers: { codi: '', 'gfps-membership': '', ...answers },
        finalized_at: null,
        finalized_by: null,
        document_code: null,
        submitted_at: null,
        submitted_by: null,
        attachment: null,
        reviews: [],
    };
}

void test('edits are sent with the value they started from', () => {
    let state = initDraft(revision({ codi: 'Old' }));
    state = editField(state, 'answers.codi', 'New');
    state = editField(state, 'details.address', 'Campus');

    assert.deepEqual(pendingPayload(state)?.payload, {
        answers: { codi: { base: 'Old', value: 'New' } },
        details: { address: { base: '', value: 'Campus' } },
    });

    // Typing back to the saved value leaves nothing to send.
    state = editField(state, 'answers.codi', 'Old');
    assert.equal(pendingPayload(state)?.payload.answers, undefined);
});

void test('a save clears what it saved and keeps what was typed since', () => {
    let state = editField(initDraft(revision()), 'answers.codi', 'First');
    const pending = pendingPayload(state);
    assert.ok(pending);

    state = editField(state, 'answers.codi', 'First and more');
    state = applySaveResult(state, pending.sent, { details: {}, answers: {} });

    assert.equal(state.saved['answers.codi'], 'First');
    assert.equal(valueOf(state, 'answers.codi'), 'First and more');
    assert.deepEqual(pendingPayload(state)?.payload.answers, {
        codi: { base: 'First', value: 'First and more' },
    });
});

void test('a conflict keeps the typed text until the person chooses', () => {
    let state = editField(initDraft(revision()), 'answers.codi', 'Mine');
    const pending = pendingPayload(state);
    assert.ok(pending);

    state = applySaveResult(state, pending.sent, {
        details: {},
        answers: { codi: 'Theirs' },
    });

    assert.equal(valueOf(state, 'answers.codi'), 'Mine');
    assert.equal(state.conflicts['answers.codi'], 'Theirs');
    assert.equal(pendingPayload(state), null, 'a conflict waits for a choice');

    const kept = resolveConflict(state, 'answers.codi', 'mine');
    assert.deepEqual(pendingPayload(kept)?.payload.answers, {
        codi: { base: 'Theirs', value: 'Mine' },
    });

    const taken = resolveConflict(state, 'answers.codi', 'saved');
    assert.equal(valueOf(taken, 'answers.codi'), 'Theirs');
    assert.equal(pendingPayload(taken), null);
});

void test('fresh server values settle into the draft', () => {
    let state = editField(initDraft(revision()), 'answers.codi', 'Mine');
    state = mergeSnapshot(
        state,
        revision({ codi: 'Theirs', 'gfps-membership': 'Colleague' }),
    );

    assert.equal(valueOf(state, 'answers.gfps-membership'), 'Colleague');
    assert.equal(state.conflicts['answers.codi'], 'Theirs');
    assert.equal(valueOf(state, 'answers.codi'), 'Mine');
});

void test('the stage says whose turn it is', () => {
    const report = (status: MonitoringReport['status'], finalized: boolean) =>
        ({
            status,
            current: {
                number: 1,
                finalized_at: finalized ? '2026-09-29T00:00:00Z' : null,
                submitted_at: null,
            },
        }) as MonitoringReport;

    assert.equal(stageOf(report('draft', false)), 'draft');
    assert.equal(stageOf(report('draft', true)), 'ready');
    assert.equal(stageOf(report('returned', false)), 'returned');
    assert.equal(stageOf(report('returned', true)), 'ready');
    assert.equal(stageOf(report('submitted', true)), 'submitted');
    assert.equal(stageOf(report('reviewed', true)), 'reviewed');
});
