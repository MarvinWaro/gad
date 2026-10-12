import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    backgroundOf,
    backgroundSvg,
    bodySize,
    CERTIFICATE_BACKGROUNDS,
    fit,
    LAYOUT,
    nameSize,
    PAGE,
    signatoryRowLeft,
} from '../../resources/js/lib/certificate-page.ts';
import {
    attendedDays,
    CERTIFICATE_BLANKS,
    certificateDates,
    fillBlanks,
    formalDate,
} from '../../resources/js/lib/certificate-text.ts';

const colors = {
    paper: '#ffffff',
    ink: '#000000',
    accent: '#7030a8',
    tint: '#f1eaf8',
};

const values = {
    event: 'GAD Orientation',
    dates: 'October 14–15, 2026',
    days: 'October 14 and 15, 2026',
    venue: 'Koronadal City',
    released: '15th day of October 2026',
};

void test("an event's dates are written out as certificates write them", () => {
    assert.equal(
        certificateDates('2026-10-14T08:00:00', null),
        'October 14, 2026',
    );
    assert.equal(
        certificateDates('2026-10-14T08:00:00', '2026-10-14T17:00:00'),
        'October 14, 2026',
    );
    assert.equal(
        certificateDates('2026-10-14T08:00:00', '2026-10-16T17:00:00'),
        'October 14–16, 2026',
    );
    assert.equal(
        certificateDates('2026-10-30T08:00:00', '2026-11-02T17:00:00'),
        'October 30 – November 2, 2026',
    );
    assert.equal(
        certificateDates('2026-12-30T08:00:00', '2027-01-02T17:00:00'),
        'December 30, 2026 – January 2, 2027',
    );
});

void test('the days someone attended read as a list, whatever their order', () => {
    assert.equal(attendedDays(['2026-10-14']), 'October 14, 2026');
    assert.equal(
        attendedDays(['2026-10-15', '2026-10-14']),
        'October 14 and 15, 2026',
    );
    assert.equal(
        attendedDays(['2026-10-14', '2026-10-16', '2026-10-17']),
        'October 14, 16 and 17, 2026',
    );
    assert.equal(
        attendedDays(['2026-10-31', '2026-11-01']),
        'October 31 and November 1, 2026',
    );
    assert.equal(
        attendedDays(['2027-01-01', '2026-12-31']),
        'December 31, 2026 and January 1, 2027',
    );
    assert.equal(attendedDays([]), '');
});

void test('"Given this" days take their ordinals', () => {
    assert.equal(formalDate('2026-10-01'), '1st day of October 2026');
    assert.equal(formalDate('2026-10-02'), '2nd day of October 2026');
    assert.equal(formalDate('2026-10-03'), '3rd day of October 2026');
    assert.equal(formalDate('2026-10-11'), '11th day of October 2026');
    assert.equal(formalDate('2026-10-12'), '12th day of October 2026');
    assert.equal(formalDate('2026-10-13'), '13th day of October 2026');
    assert.equal(formalDate('2026-10-21'), '21st day of October 2026');
    assert.equal(formalDate('2026-10-22'), '22nd day of October 2026');
    assert.equal(formalDate('2026-10-31'), '31st day of October 2026');
});

void test('the blanks are filled in, with the event in bold', () => {
    assert.deepEqual(
        fillBlanks(
            'for participating in the {event} held on {dates}. Given this {released} at {venue}.',
            values,
        ),
        [
            { text: 'for participating in the ', bold: false },
            { text: 'GAD Orientation', bold: true },
            {
                text: ' held on October 14–15, 2026. Given this 15th day of October 2026 at Koronadal City.',
                bold: false,
            },
        ],
    );
    // Every blank the server allows is one the wording fills.
    for (const blank of CERTIFICATE_BLANKS) {
        assert.equal(fillBlanks(`{${blank}}`, values)[0]?.text, values[blank]);
    }
});

void test("a blank the wording doesn't know stays as typed, and spaces settle", () => {
    assert.deepEqual(fillBlanks('  at {place},\n  {venue} ', values), [
        { text: 'at {place}, Koronadal City', bold: false },
    ]);
    assert.deepEqual(fillBlanks('{constructor}', values), [
        { text: '{constructor}', bold: false },
    ]);
});

void test('a long name shrinks to stay on one line, never below a readable size', () => {
    assert.equal(nameSize('ANA REYES'), 32);
    const long = nameSize('MA. CRISTINA ANGELICA DELA CRUZ-VILLANUEVA');
    assert.ok(long < 32 && long >= 18);
    assert.equal(nameSize('A'.repeat(200)), 18);
    assert.equal(bodySize('x'.repeat(100)), 13.5);
    assert.equal(bodySize('x'.repeat(300)), 12.5);
    assert.equal(bodySize('x'.repeat(400)), 11.5);
});

void test('one, two or three signatories sit centred on the page', () => {
    for (const count of [1, 2, 3]) {
        const left = signatoryRowLeft(count);
        const width =
            count * LAYOUT.signatoryWidth + (count - 1) * LAYOUT.signatoryGap;

        assert.ok(Math.abs(left + width / 2 - PAGE.width / 2) < 0.01);
        // Clear of the verify block in the bottom-right corner.
        assert.ok(left + width < PAGE.width - LAYOUT.qr - 30);
    }
    assert.deepEqual(fit({ width: 600, height: 200 }, 150, 46), {
        width: 138,
        height: 46,
    });
});

void test('each background is a page-sized drawing in the paper colours', () => {
    for (const background of CERTIFICATE_BACKGROUNDS) {
        const svg = backgroundSvg(background, colors);

        assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
        assert.ok(svg.includes(`width="${PAGE.width}"`));
        assert.ok(svg.includes(colors.accent));
        assert.ok(!svg.includes('undefined') && !svg.includes('NaN'));
    }
    assert.equal(backgroundOf('gold'), 'frame');
    assert.equal(backgroundSvg('gold', colors), backgroundSvg('frame', colors));
});
