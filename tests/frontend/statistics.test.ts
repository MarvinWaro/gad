import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AcademicDataset } from '../../resources/js/data/phlgadis-demo.ts';
import {
    axisLines,
    byFemaleShare,
    byTotal,
    femaleShare,
    filterRecords,
    largestBar,
    summarize,
} from '../../resources/js/lib/gad-statistics.ts';

// A few discipline groups from CHED RO XII's AY 2025-2026 enrollment and
// AY 2024-2025 graduates files.
const dataset: AcademicDataset = {
    year: '2025-2026',
    enrollment: [
        {
            program: 'Agricultural, Forestry, and Fisheries',
            male: 5523,
            female: 5318,
        },
        { program: 'Architectural and Town-Planning', male: 186, female: 242 },
        {
            program: 'Business Administration and Related',
            male: 21430,
            female: 34696,
        },
    ],
    graduates: [
        { program: 'Maritime', male: 367, female: 7 },
        { program: 'Religion and Theology', male: 5, female: 0 },
    ],
};

void test('summaries add up every discipline group', () => {
    assert.equal(summarize(dataset.enrollment).male, 27139);
    assert.equal(summarize(dataset.enrollment).female, 40256);
    assert.equal(summarize(dataset.enrollment).total, 67395);
    assert.equal(summarize(dataset.graduates).male, 372);
    assert.equal(summarize(dataset.graduates).female, 7);
    assert.equal(summarize(dataset.graduates).total, 379);
});

void test('sex filters keep cards, charts and tables on the same selected totals', () => {
    for (const kind of ['enrollment', 'graduates'] as const) {
        const records = dataset[kind];
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

void test("groups rank by size or by women's share without changing the data", () => {
    const records = dataset.enrollment;
    const original = structuredClone(records);
    assert.deepEqual(
        byTotal(records).map((row) => row.program),
        [
            'Business Administration and Related',
            'Agricultural, Forestry, and Fisheries',
            'Architectural and Town-Planning',
        ],
    );
    assert.deepEqual(
        byFemaleShare(records).map((row) => row.program),
        [
            'Business Administration and Related',
            'Architectural and Town-Planning',
            'Agricultural, Forestry, and Fisheries',
        ],
    );
    assert.equal(femaleShare(records[0]), 49);
    assert.equal(femaleShare({ program: 'Empty', male: 0, female: 0 }), 0);
    assert.deepEqual(records, original);
});

void test('every bar is drawn against the longest one in view', () => {
    assert.equal(largestBar(dataset.enrollment, 'all'), 34696);
    assert.equal(largestBar(dataset.enrollment, 'male'), 21430);
    assert.equal(largestBar(dataset.graduates, 'female'), 7);
    assert.equal(largestBar([], 'all'), 0);
});

void test('axis names break between words into two lines at most', () => {
    assert.deepEqual(axisLines('Engineering'), ['Engineering']);
    assert.deepEqual(axisLines('Education Science and Teacher Training'), [
        'Education Science',
        'and Teacher Training',
    ]);
    assert.deepEqual(axisLines('Agricultural, Forestry, and Fisheries'), [
        'Agricultural,',
        'Forestry, and Fisheries',
    ]);
    assert.deepEqual(axisLines('Mass Communication and Documentation'), [
        'Mass Communication',
        'and Documentation',
    ]);
    // A single long word stays whole.
    assert.deepEqual(axisLines('Interdisciplinarity'), ['Interdisciplinarity']);
});
