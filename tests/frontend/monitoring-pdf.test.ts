import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    buildMonitoringDocument,
    formatAccomplishedDate,
    monitoringPdfFileName,
    needsFallbackFont,
    PDF_FONTS,
} from '../../resources/js/lib/monitoring-pdf.ts';
import type { MonitoringPdfInput } from '../../resources/js/lib/monitoring-pdf.ts';
import type { MonitoringTemplate } from '../../resources/js/types/monitoring.ts';

const template: MonitoringTemplate = {
    version: '2025',
    title: 'Compliance to CMO No. 01, s. 2015',
    subtitle: [[{ text: 'Subtitle' }]],
    columns: {
        requirements: 'REQUIREMENTS',
        status: 'STATUS OF COMPLIANCE',
        instruction: 'Please state actual situations per item.',
    },
    labels: {
        institution: 'Name of HEI',
        address: 'Address',
        accomplished_on: 'Date Accomplished',
        signature: '(Name and signature)',
    },
    signatories: [
        { key: 'president_name', role: 'President' },
        { key: 'focal_person_name', role: 'GAD Focal Person' },
    ],
    sections: [
        {
            key: 'gfps',
            number: '1)',
            title: 'Establishment of GFPS',
            bold: true,
            layout: 'rows',
            items: [
                { key: 'gfps-membership', label: 'Membership composition' },
                { key: 'gfps-policies', label: 'Policy review' },
            ],
        },
        {
            key: 'plan',
            number: '2)',
            title: 'GAD Plan and Budget',
            bold: false,
            layout: 'single',
            detail: 'Programs per AY',
            items: [{ key: 'plan-budget', label: 'GAD Plan and Budget' }],
        },
        {
            key: 'opportunity',
            number: '4)',
            title: 'Equal Opportunity Principle',
            bold: true,
            layout: 'combined',
            items: [
                { key: 'opportunity-hiring', label: 'Hiring' },
                {
                    key: 'opportunity-admission',
                    label: 'Admission of students',
                },
            ],
        },
        {
            key: 'gedsi',
            number: '12.',
            title: 'Support to GEDSI',
            bold: true,
            layout: 'combined',
            items: [{ key: 'gedsi-programs', label: 'Programs for PWDs' }],
        },
    ],
};

function input(
    overrides: Partial<MonitoringPdfInput> = {},
): MonitoringPdfInput {
    return {
        template,
        office: {
            name: 'Regional Office XII',
            city: 'Koronadal City',
            address: 'PRIME Government Center',
            email: 'chedro12@ched.gov.ph',
            website: 'chedro12.gov.ph',
            phone: '(083) 228-7572',
        },
        institutionName: 'B.E.S.T. College of Polomolok, Inc.',
        academicYear: '2026-2027',
        semester: 1,
        revisionNumber: 1,
        documentCode: '7F3A-91C2',
        details: {
            address: 'Polomolok',
            accomplished_on: '2026-09-29',
            president_name: 'Example President',
            focal_person_name: 'Example Focal Person',
        },
        answers: {
            'gfps-membership': 'Chair and members',
            'plan-budget': 'First line\n\nSecond line',
            'opportunity-hiring': 'Merit-based hiring',
            'gedsi-programs': 'Programs for all',
        },
        ...overrides,
    };
}

/** Every string in the document, to look for text without its layout. */
function strings(node: unknown): string[] {
    if (typeof node === 'string') return [node];
    if (Array.isArray(node)) return node.flatMap(strings);
    if (node && typeof node === 'object') {
        return Object.values(node).flatMap(strings);
    }

    return [];
}

/** The words a node prints: its text, without links, fonts or colours. */
function words(node: unknown): string {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(words).join('');
    if (node && typeof node === 'object') {
        const { text, columns, stack } = node as Record<string, unknown>;

        return words(text ?? columns ?? stack ?? '');
    }

    return '';
}

function tableBody(document: ReturnType<typeof buildMonitoringDocument>) {
    const content = document.content as unknown[];
    const table = content[2] as { table: { body: unknown[][] } };

    return table.table.body;
}

void test('rows follow the form: a heading row, lettered rows, and single rows', () => {
    const body = tableBody(buildMonitoringDocument(input()));

    // Header, 1) heading, a., b., 2), 4) combined, 12. combined.
    assert.equal(body.length, 7);
    assert.equal(body[1][1], '', 'the numbered heading row has no answer');
    assert.ok(strings(body[2][0]).includes('a.'));
    assert.equal(body[3][1], '', 'a blank answer prints blank');
    assert.ok(strings(body[4][0]).join('').includes('Programs per AY'));
});

void test('combined rows label answers only when there are several', () => {
    const body = tableBody(buildMonitoringDocument(input()));
    const opportunity = strings(body[5][1]).join('');
    const gedsi = strings(body[6][1]).join('');

    assert.ok(opportunity.includes('a. Hiring'));
    assert.ok(opportunity.includes('b. Admission of students'));
    assert.ok(!gedsi.includes('a. Programs'));
    assert.ok(strings(body[6][0]).join('').startsWith('12. Support'));
});

void test('typed line breaks become paragraphs, blank lines keep their space', () => {
    const body = tableBody(buildMonitoringDocument(input()));
    const plan = body[4][1] as { stack: unknown[] };

    assert.equal(plan.stack.length, 3);
    assert.deepEqual((plan.stack[1] as { text: string }).text, ' ');
});

void test('a draft carries a watermark and says so in the footer', () => {
    const draft = buildMonitoringDocument(input({ documentCode: null }));
    const final = buildMonitoringDocument(input());
    const footer = (document: typeof draft) =>
        strings(
            (document.footer as (page: number, pages: number) => unknown)(1, 3),
        ).join(' ');

    assert.ok(draft.watermark);
    assert.equal(final.watermark, undefined);
    assert.match(footer(draft), /Draft — not for signature · Page 1 of 3/);
    assert.match(footer(final), /Document code 7F3A-91C2 · Page 1 of 3/);
    assert.match(
        monitoringPdfFileName(input({ documentCode: null })),
        /_DRAFT\.pdf$/,
    );
    assert.equal(
        monitoringPdfFileName(input()),
        'GAD-Monitoring-Report_BEST-College-of-Polomolok-Inc_2026-2027_S1_Rev1.pdf',
    );
});

void test('the letterhead prints only the office details on record', () => {
    const header = (office: MonitoringPdfInput['office']) =>
        strings(
            (
                buildMonitoringDocument(input({ office }))
                    .header as () => unknown
            )(),
        );

    assert.ok(header(input().office).includes('Koronadal City'));
    assert.ok(header(input().office).includes('OFFICE OF THE PRESIDENT'));
    assert.ok(!header(null).includes('Koronadal City'));
});

void test('the footer prints only the office details on record, and is blank without any', () => {
    const footer = (office: MonitoringPdfInput['office']) => {
        const content = (
            buildMonitoringDocument(input({ office })).footer as (
                page: number,
                pages: number,
            ) => unknown
        )(1, 1) as { stack: [unknown, { stack: unknown[] }, { text: string }] };
        const [, contact, period] = content.stack;

        return {
            lines: contact.stack.map(words),
            icons: strings(contact.stack),
            period: period.text,
        };
    };
    const none = {
        name: 'Regional Office IX',
        city: null,
        address: null,
        email: null,
        website: null,
        phone: null,
    };

    assert.deepEqual(footer(input().office).lines, [
        'PRIME Government Center',
        'chedro12@ched.gov.ph; chedro12.gov.ph | www.ched.gov.ph',
        '(083) 228-7572',
    ]);
    // Any one detail brings CHED's site along, as in the form.
    const email = footer({ ...none, email: 'chedro12@ched.gov.ph' });
    assert.deepEqual(email.lines, ['chedro12@ched.gov.ph | www.ched.gov.ph']);
    assert.ok(email.icons.includes('envelope'));
    const website = footer({ ...none, website: 'chedro12.gov.ph' });
    assert.deepEqual(website.lines, ['chedro12.gov.ph | www.ched.gov.ph']);
    assert.ok(!website.icons.includes('envelope'));
    assert.deepEqual(footer({ ...none, phone: '(083) 228-7572' }).lines, [
        'www.ched.gov.ph',
        '(083) 228-7572',
    ]);

    // With none on record, the contact lines are blank; the code stays.
    for (const office of [none, null]) {
        assert.deepEqual(footer(office).lines, []);
        assert.match(
            footer(office).period,
            /Document code 7F3A-91C2 · Page 1 of 1$/,
        );
    }
});

void test('characters the narrow face lacks use the fallback face', () => {
    const peso = input({ answers: { 'plan-budget': 'Budget of ₱150,000' } });

    assert.equal(needsFallbackFont(input()), false);
    assert.equal(needsFallbackFont(peso), true);

    const plan = tableBody(buildMonitoringDocument(peso))[4][1] as {
        stack: { text: { text: string; font?: string }[] }[];
    };
    const runs = plan.stack[0].text;
    assert.ok(
        runs.some((run) => run.text === '₱' && run.font === PDF_FONTS.fallback),
    );
    assert.ok(runs.every((run) => run.text === '₱' || run.font === undefined));
});

void test('dates print in words without shifting a day', () => {
    assert.equal(formatAccomplishedDate('2026-09-29'), 'September 29, 2026');
    assert.equal(formatAccomplishedDate('2026-01-01'), 'January 1, 2026');
    assert.equal(formatAccomplishedDate(''), '');
});
