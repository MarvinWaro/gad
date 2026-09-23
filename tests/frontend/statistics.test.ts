import assert from 'node:assert/strict';
import { test } from 'node:test';
import { datasets } from '../../resources/js/data/phlgadis-demo.ts';
import {
    filterRecords,
    summarize,
} from '../../resources/js/lib/gad-statistics.ts';

void test('demo breakdowns reconcile with supplied enrollment and graduate totals', () => {
    assert.equal(summarize(datasets[0].enrollment).male, 95737);
    assert.equal(summarize(datasets[0].enrollment).female, 132086);
    assert.equal(summarize(datasets[0].enrollment).total, 227823);
    assert.equal(summarize(datasets[0].graduates).male, 11800);
    assert.equal(summarize(datasets[0].graduates).female, 20190);
    assert.equal(summarize(datasets[0].graduates).total, 31990);
});

void test('sex filters keep cards, charts and tables on the same selected totals', () => {
    for (const kind of ['enrollment', 'graduates'] as const) {
        const records = datasets[0][kind];
        const original = structuredClone(records);
        const all = summarize(records);
        const male = summarize(filterRecords(records, 'male'));
        const female = summarize(filterRecords(records, 'female'));
        assert.equal(male.total, all.male);
        assert.equal(male.female, 0);
        assert.equal(male.malePercentage, 100);
        assert.equal(female.total, all.female);
        assert.equal(female.male, 0);
        assert.equal(female.femalePercentage, 100);
        assert.deepEqual(filterRecords(records, 'all'), original);
        assert.deepEqual(records, original);
    }
});

void test('empty and zero records never generate invalid percentages', () => {
    assert.deepEqual(summarize([]), {
        male: 0,
        female: 0,
        total: 0,
        malePercentage: 0,
        femalePercentage: 0,
    });
    assert.equal(
        summarize([{ program: 'Empty', male: 0, female: 0 }]).malePercentage,
        0,
    );
    assert.deepEqual(filterRecords([], 'female'), []);
});
