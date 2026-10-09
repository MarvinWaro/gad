import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    CARD_RATIO,
    fitText,
    layoutCard,
} from '../../resources/js/lib/virtual-id.ts';
import type { Measure } from '../../resources/js/lib/virtual-id.ts';

/** Every character half as wide as the type is tall, like a real face. */
const measure: Measure = (text, font) =>
    text.length * Number(/([\d.]+)px/u.exec(font)?.[1] ?? 0) * 0.5;
const fonts = { sans: 'sans-serif', mono: 'monospace' };
const size = (font: string) => (px: number) => `600 ${px}px ${font}`;

void test('the card is a bank card held upright', () => {
    assert.equal(CARD_RATIO.toFixed(4), (85.6 / 53.98).toFixed(4));

    const layout = layoutCard(
        { name: 'Marvin Waro', affiliation: 'CHED Central Office' },
        320,
        fonts,
        measure,
    );
    assert.equal(Math.round(layout.height), Math.round(320 * CARD_RATIO));
});

void test('text keeps its size while it fits, then two even lines, then smaller', () => {
    assert.deepEqual(
        fitText('Marvin Waro', [20, 16], 280, size('x'), measure),
        {
            size: 20,
            lines: ['Marvin Waro'],
        },
    );
    // Too wide for one line at 20px: two lines, as even as the words allow.
    assert.deepEqual(
        fitText(
            'Ma. Concepcion Bernadette Dela Cruz',
            [20, 16],
            280,
            size('x'),
            measure,
        ),
        { size: 20, lines: ['Ma. Concepcion', 'Bernadette Dela Cruz'] },
    );
});

void test('past the smallest size it wraps onto more lines, never cutting text', () => {
    const name =
        'Ma. Concepcion Bernadette Dela Cruz-Villanueva Santiago Bautista III';
    const fitted = fitText(name, [20, 16], 200, size('x'), measure);

    assert.equal(fitted.size, 16);
    assert.ok(fitted.lines.length > 2);
    assert.equal(fitted.lines.join(' '), name);
    assert.ok(fitted.lines.every((line) => line.length * 8 <= 200));
});

void test('a long name and place shrink the QR first, never past a readable size', () => {
    const short = layoutCard(
        { name: 'Ana Cruz', affiliation: 'CHED Central Office' },
        320,
        fonts,
        measure,
    );
    const long = layoutCard(
        {
            name: 'Ma. Concepcion Bernadette Dela Cruz-Villanueva III',
            affiliation:
                'Bangsamoro Autonomous Region In Muslim Mindanao State College of Technology',
        },
        320,
        fonts,
        measure,
    );
    const textBottom = (layout: typeof long) =>
        layout.affiliation.top +
        layout.affiliation.lines.length *
            layout.affiliation.size *
            layout.affiliation.lineHeight;

    assert.ok(long.qr.size < short.qr.size);
    assert.ok(long.qr.size >= 0.34 * 320 - 0.01);
    // Nothing runs into the QR or off the card.
    assert.ok(textBottom(long) < long.qr.y);
    assert.ok(long.caption.top < long.height - long.foot);
});
