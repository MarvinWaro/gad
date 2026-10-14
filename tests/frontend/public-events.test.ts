import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    eventPlace,
    formatEventTime,
} from '../../resources/js/lib/event-dates.ts';
import { withQueryValue } from '../../resources/js/lib/query.ts';
import type { PublicEvent } from '../../resources/js/types/events.ts';

const orientation: PublicEvent = {
    ulid: '01k7a8m6x2c3v4b5n6m7q8r9s0',
    title: 'GAD Orientation',
    description: null,
    location: 'Koronadal City',
    category: 'training',
    starts_at: '2026-10-14T08:00:00',
    ends_at: '2026-10-15T17:00:00',
    is_all_day: false,
    region: 'Regional Office XII',
    status: 'upcoming',
    registration_open: true,
    registration_closes_at: null,
};

void test('a public event reads its time as the calendars do', () => {
    assert.equal(
        formatEventTime(orientation),
        'Oct 14, 8:00 AM – Oct 15, 5:00 PM',
    );
    assert.equal(
        formatEventTime({ ...orientation, ends_at: '2026-10-14T12:00:00' }),
        '8:00 AM – 12:00 PM',
    );
    assert.equal(
        formatEventTime({ ...orientation, is_all_day: true, ends_at: null }),
        'All day',
    );
});

void test('an event says whose it is', () => {
    assert.equal(eventPlace(orientation.region), 'For Regional Office XII');
    assert.equal(eventPlace(null), 'For every region');
});

void test('one filter changes in the address, and the others stay', () => {
    assert.deepEqual(withQueryValue('?region=12', 'events_region', '9'), {
        region: '12',
        events_region: '9',
    });
    assert.deepEqual(
        withQueryValue('?region=12&events_region=9', 'events_region', '4'),
        { region: '12', events_region: '4' },
    );
    assert.deepEqual(
        withQueryValue('?region=12&events_region=9', 'events_region', null),
        { region: '12' },
    );
    assert.deepEqual(withQueryValue('', 'region', ''), {});
});
