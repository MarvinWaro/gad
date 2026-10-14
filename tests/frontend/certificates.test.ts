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
    QR_LEFT,
    qrSvg,
    signatoryRowLeft,
} from '../../resources/js/lib/certificate-page.ts';
import {
    attendedDays,
    CERTIFICATE_BLANKS,
    certificateDates,
    fillBlanks,
    formalDate,
    isMissingPictures,
    missingPictures,
} from '../../resources/js/lib/certificate-text.ts';
import {
    drawWidth,
    MAX_DRAW_WIDTH,
    redrawDelay,
    TYPING_DELAY_MS,
} from '../../resources/js/lib/certificate-preview.ts';
import type { CertificateDocument } from '../../resources/js/types/certificates.ts';

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
        // Clear of the verify QR in the bottom-right corner.
        assert.ok(left + width < QR_LEFT);
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

void test('pictures that could not be loaded are named, in one clause', () => {
    assert.equal(
        missingPictures(['the e-signature of Maria Santos']),
        "The e-signature of Maria Santos couldn't be loaded",
    );
    assert.equal(
        missingPictures(['extra logo 1', 'the e-signature of Jose Cruz']),
        "Extra logo 1 and the e-signature of Jose Cruz couldn't be loaded",
    );

    const refused = Object.assign(
        new Error("Extra logo 1 couldn't be loaded"),
        {
            name: 'MissingPicturesError',
            missing: ['extra logo 1'],
        },
    );
    assert.equal(isMissingPictures(refused), true);
    assert.equal(isMissingPictures(new Error('offline')), false);
    assert.equal(isMissingPictures('MissingPicturesError'), false);
});

void test('the preview redraws a pick at once, and waits for a pause in typing', () => {
    const page = {
        number: 'CERT-0000-0000',
        verify_url: 'https://example.test/verify/CERT-0000-0000',
        qr: [],
        kind: 'participation',
        title: 'Certificate of Participation',
        lead: 'is presented to',
        name: 'JUAN DELA CRUZ',
        affiliation: null,
        background: 'frame',
        body: 'for participating in the {event}.',
        event: null,
        office: null,
        days: [],
        released_on: '2026-10-15',
        logos: [],
        signatories: [],
    } as const satisfies CertificateDocument;

    assert.equal(redrawDelay(null, page), 0);
    assert.equal(redrawDelay(page, { ...page, background: 'flow' }), 0);
    assert.equal(
        redrawDelay(page, { ...page, body: `${page.body} Thank you.` }),
        TYPING_DELAY_MS,
    );
    // Wording replaced along with the kind: a pick.
    assert.equal(
        redrawDelay(page, {
            ...page,
            kind: 'appearance',
            body: 'appeared at the {event}.',
        }),
        0,
    );
});

void test('the preview is drawn as wide as it shows, sharp on dense screens, within a limit', () => {
    assert.equal(drawWidth(730, 1), 730);
    assert.equal(drawWidth(447.5, 2), 895);
    assert.equal(drawWidth(900, 2), MAX_DRAW_WIDTH);
    // Not laid out yet: the widest.
    assert.equal(drawWidth(0, 1), MAX_DRAW_WIDTH);
});

void test('the verify QR is one crisp path on its own paper square, with a quiet zone', () => {
    const rows = ['1110', '0011', '1001', '0000'];
    const svg = qrSvg(rows, LAYOUT.qr, colors);

    // Four modules a side plus four of quiet zone on each, scaled to 72 pt.
    assert.match(svg, /width="72" height="72" viewBox="0 0 12 12"/);
    assert.match(
        svg,
        /<rect width="12" height="12" rx="[\d.]+" fill="#ffffff"\/>/,
    );
    assert.equal(svg.match(/<path /g)?.length, 1);
    // Each row's dark runs, merged, offset by the quiet zone.
    assert.match(
        svg,
        /d="M4 4h3v1h-3zM6 5h2v1h-2zM4 6h1v1h-1zM7 6h1v1h-1z" fill="#000000"/,
    );
    // Clear of the widest signatories' row and the page's foot.
    assert.ok(QR_LEFT + LAYOUT.qr < PAGE.width - 30);
    assert.ok(LAYOUT.qrTop + LAYOUT.qr < PAGE.height - 24);
});
