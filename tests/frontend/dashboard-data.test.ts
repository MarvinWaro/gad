import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    dashboardSnapshot,
    periods,
    reportingPeriod,
    previewEvents,
    type DashboardPeriod,
} from '../../resources/js/components/dashboard/dashboard-data.ts';

void test('dashboard periods reconcile chart, survey, respondent and interaction totals', () => {
    for (const period of Object.keys(periods) as DashboardPeriod[]) {
        const data = dashboardSnapshot(period);
        assert.equal(
            data.activity.reduce((sum, row) => sum + row.responses, 0),
            data.responses,
        );
        assert.equal(
            data.activity.reduce((sum, row) => sum + row.posts, 0),
            data.posts,
        );
        assert.equal(
            data.surveys.reduce((sum, row) => sum + row.count, 0),
            data.responses,
        );
        assert.equal(
            data.respondents.reduce((sum, row) => sum + row.value, 0),
            data.responses,
        );
        assert.equal(
            data.likes + data.comments + data.shares,
            data.interactions,
        );
        assert.ok(data.participating <= data.institutions);
        assert.ok(data.contributors <= data.institutions);
    }
});

void test('overlapping periods and comparison baselines share consistent activity totals', () => {
    const month = dashboardSnapshot('month');
    const quarter = dashboardSnapshot('quarter');
    const semester = dashboardSnapshot('semester');
    const annual = dashboardSnapshot('annual');
    assert.equal(semester.activity.length, 6);
    assert.equal(annual.activity.length, 12);
    assert.deepEqual(semester.activity, annual.activity.slice(6));
    for (const metric of ['responses', 'posts'] as const) {
        const sum = (rows: typeof annual.activity) =>
            rows.reduce((total, row) => total + row[metric], 0);
        assert.equal(annual.activity[8][metric], month[metric]);
        assert.equal(sum(quarter.activity.slice(4)), month[metric]);
        assert.equal(sum(annual.activity.slice(6, 9)), quarter[metric]);
        const previous =
            metric === 'responses' ? 'previousResponses' : 'previousPosts';
        assert.equal(annual.activity[7][metric], month[previous]);
        assert.equal(sum(annual.activity.slice(3, 6)), quarter[previous]);
        assert.equal(sum(annual.activity.slice(0, 6)), semester[previous]);
    }
});

void test('annual sample calendar contains four chronological events from March to November', () => {
    assert.equal(previewEvents.length, 4);
    const dates = previewEvents.map((event) => event.date);
    assert.deepEqual(dates, [...dates].sort());
    assert.ok(dates.every((date) => date.startsWith('2026-')));
    assert.ok(dates[0].startsWith('2026-03'));
    assert.ok(dates[3].startsWith('2026-11'));
});

void test('every selectable month, quarter and semester reconciles with annual data', () => {
    const annual = dashboardSnapshot('annual');
    for (const period of ['month', 'quarter', 'semester'] as const) {
        const size = period === 'month' ? 1 : period === 'quarter' ? 3 : 6;
        for (let index = 0; index < 12; index += size) {
            const data = dashboardSnapshot(period, index);
            const months = annual.activity.slice(index, index + size);
            for (const metric of ['responses', 'posts'] as const) {
                assert.equal(
                    data[metric],
                    months.reduce((sum, row) => sum + row[metric], 0),
                );
                assert.equal(
                    data[metric],
                    data.activity.reduce((sum, row) => sum + row[metric], 0),
                );
            }
            assert.equal(
                data.surveys.reduce((sum, row) => sum + row.count, 0),
                data.responses,
            );
            assert.equal(
                data.respondents.reduce((sum, row) => sum + row.value, 0),
                data.responses,
            );
            assert.equal(reportingPeriod(period, index).start, index);
            if (index === 0) {
                assert.equal(data.responseGrowth, null);
                assert.equal(data.postGrowth, null);
            }
        }
    }
    assert.equal(
        dashboardSnapshot('month', 7).responseGrowth?.startsWith('-'),
        true,
    );
    assert.match(reportingPeriod('month', 1).range, /Feb 28, 2026/);
});
