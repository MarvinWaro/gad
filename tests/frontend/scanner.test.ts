import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    cameraProblem,
    checkInProblem,
    COOLDOWN_MS,
    eventStatus,
    isCoolingDown,
    pastedCode,
    readParticipantCode,
    typedCode,
} from '../../resources/js/lib/scanner.ts';

void test('a QR counts only when it holds a Virtual ID code', () => {
    assert.equal(readParticipantCode('GAD-7K2M-Q9XA'), 'GAD-7K2M-Q9XA');
    assert.equal(readParticipantCode(' gad-7k2m-q9xa\n'), 'GAD-7K2M-Q9XA');
    // U is not in the alphabet; another system's code; a web address.
    assert.equal(readParticipantCode('GAD-7K2M-Q9XU'), null);
    assert.equal(readParticipantCode('CHED-7K2M-Q9XA'), null);
    assert.equal(
        readParticipantCode('https://example.test/GAD-7K2M-Q9XA'),
        null,
    );
});

void test('typing keeps only what a code can hold, read as the server reads it', () => {
    assert.equal(typedCode('7k2m'), '7K2M');
    // I and L read as 1, O as 0; U and punctuation are dropped.
    assert.equal(typedCode('iLoO'), '1100');
    assert.equal(typedCode('q9-xa u!'), 'Q9XA');
});

void test('a pasted code fills the eight boxes, with or without its prefix', () => {
    assert.equal(pastedCode('GAD-7K2M-Q9XA'), '7K2MQ9XA');
    assert.equal(pastedCode(' gad 7k2m q9xa '), '7K2MQ9XA');
    assert.equal(pastedCode('7K2M-Q9XA'), '7K2MQ9XA');
    // A code whose own characters begin with G, A and D keeps them.
    assert.equal(pastedCode('GADX-1234'), 'GADX1234');
    assert.equal(pastedCode('GAD-GADX-1234'), 'GADX1234');
});

void test('the same code held in view is handled once, then again after a pause', () => {
    const last = { code: 'GAD-7K2M-Q9XA', at: 1000 };

    assert.equal(isCoolingDown('GAD-7K2M-Q9XA', last, 1000 + 500), true);
    assert.equal(
        isCoolingDown('GAD-7K2M-Q9XA', last, 1000 + COOLDOWN_MS),
        false,
    );
    // Someone else comes up straight away.
    assert.equal(isCoolingDown('GAD-ZZZZ-ZZZZ', last, 1000 + 500), false);
    assert.equal(isCoolingDown('GAD-7K2M-Q9XA', null, 1000), false);
});

void test("today's events say whether they are under way, in Philippine time", () => {
    const training = {
        starts_at: '2026-10-15T08:00:00',
        ends_at: '2026-10-15T17:00:00',
    };

    assert.equal(eventStatus(training, '2026-10-15T07:30'), 'later');
    assert.equal(eventStatus(training, '2026-10-15T08:00'), 'ongoing');
    assert.equal(eventStatus(training, '2026-10-15T17:00'), 'ongoing');
    assert.equal(eventStatus(training, '2026-10-15T17:01'), 'ended');
    // All day, and a three-day writeshop on its second day.
    assert.equal(
        eventStatus(
            {
                starts_at: '2026-10-15T00:00:00',
                ends_at: '2026-10-15T23:59:59',
            },
            '2026-10-15T21:00',
        ),
        'ongoing',
    );
    assert.equal(
        eventStatus(
            {
                starts_at: '2026-10-14T08:00:00',
                ends_at: '2026-10-16T17:00:00',
            },
            '2026-10-15T07:00',
        ),
        'ongoing',
    );
    // No end time: under way from its start to the end of its day.
    const forum = { starts_at: '2026-10-15T18:00:00', ends_at: null };
    assert.equal(eventStatus(forum, '2026-10-15T12:00'), 'later');
    assert.equal(eventStatus(forum, '2026-10-15T23:30'), 'ongoing');
});

void test('camera and check-in failures say what happened in plain words', () => {
    const error = (name: string) => Object.assign(new Error(name), { name });

    assert.equal(cameraProblem(error('NotAllowedError')), 'blocked');
    assert.equal(cameraProblem(error('SecurityError')), 'blocked');
    assert.equal(cameraProblem(error('NotFoundError')), 'missing');
    assert.equal(cameraProblem(error('OverconstrainedError')), 'missing');
    assert.equal(cameraProblem(error('NotReadableError')), 'busy');
    assert.equal(cameraProblem(new TypeError('broken')), 'failed');
    assert.equal(cameraProblem('nothing'), 'failed');

    assert.match(checkInProblem(419), /session has ended/);
    assert.match(checkInProblem(403), /can't check people in/);
    assert.match(checkInProblem(404), /no longer exists/);
    assert.match(checkInProblem(429), /Too many/);
    assert.match(checkInProblem(500), /didn't go through/);
});
