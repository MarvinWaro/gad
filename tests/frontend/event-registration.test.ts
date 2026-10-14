import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    eventStatuses,
    formatMoment,
    registrationNote,
} from '../../resources/js/lib/event-dates.ts';

void test("a closing time reads as a date and a time, whatever the browser's zone", () => {
    assert.equal(formatMoment('2026-10-20T17:00:00'), 'October 20, 5:00 PM');
    assert.equal(formatMoment('2026-12-01T09:05:00'), 'December 1, 9:05 AM');
});

void test('the event page says where registration stands', () => {
    const open = { registration_open: true, ended: false };
    const closed = { registration_open: false, ended: false };

    assert.equal(
        registrationNote({ ...open, registration_closes_at: null }),
        'Registration is open until the event ends.',
    );
    assert.equal(
        registrationNote({
            ...open,
            registration_closes_at: '2026-10-20T17:00:00',
        }),
        'Registration closes October 20, 5:00 PM.',
    );
    assert.equal(
        registrationNote({
            ...closed,
            registration_closes_at: '2026-10-12T09:00:00',
        }),
        'Registration closed October 12, 9:00 AM.',
    );
    assert.equal(
        registrationNote({
            registration_open: false,
            ended: true,
            registration_closes_at: '2026-10-12T09:00:00',
        }),
        'This event has ended.',
    );
});

void test('each status reads in words, happening now in the positive tone and cancelled in danger', () => {
    assert.deepEqual(
        Object.entries(eventStatuses).map(([status, { label, tone }]) => [
            status,
            label,
            tone,
        ]),
        [
            ['ongoing', 'Happening now', 'positive'],
            ['upcoming', 'Upcoming', 'info'],
            ['ended', 'Ended', 'neutral'],
            ['cancelled', 'Cancelled', 'danger'],
        ],
    );
});

void test('a cancelled event says so before anything about registration', () => {
    assert.equal(
        registrationNote({
            registration_open: false,
            ended: true,
            cancelled: true,
            registration_closes_at: null,
        }),
        'This event was cancelled.',
    );
});
