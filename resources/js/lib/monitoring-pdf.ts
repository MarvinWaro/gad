import type {
    Content,
    CustomTableLayout,
    DynamicContent,
    TDocumentDefinitions,
    TableCell,
} from 'pdfmake/interfaces';
import type {
    MonitoringDetails,
    MonitoringTemplate,
    RegionOffice,
    TemplateRun,
    TemplateSection,
} from '../types/monitoring';

/**
 * The printable monitoring report: CHED's official Word form, letterhead and
 * all, filled in with one revision. Pure, so it can be tested without a
 * browser; monitoring-pdf-download.ts renders it with pdfmake.
 *
 * Measurements come from the Word file
 * (public/assets/document/CHEDRO_XII_GAD_MONITORING _TEMPLATE_2025.docx) and
 * its printout, in points (72 to the inch).
 */

export type MonitoringPdfInput = {
    template: MonitoringTemplate;
    office: RegionOffice | null;
    institutionName: string;
    academicYear: string;
    semester: 1 | 2;
    revisionNumber: number;
    /** Null until the revision is finalized: a draft prints with a watermark. */
    documentCode: string | null;
    details: MonitoringDetails;
    answers: Record<string, string>;
};

/** Font families the document uses, which the loader maps to files. */
export const PDF_FONTS = {
    /** Arial Narrow's metrics, so text wraps as it does in the Word form. */
    body: 'LiberationSansNarrow',
    /** For characters the narrow face lacks, such as the peso sign. */
    fallback: 'LiberationSans',
    /** Stands in for the letterhead's Bookman Old Style. */
    letterhead: 'TeXGyreBonum',
} as const;

/** Images the document refers to by name, which the loader maps to files. */
export const PDF_IMAGES = [
    'chedSeal',
    'bagongPilipinas',
    'envelope',
    'phone',
] as const;

// The Word form is printed on Philippine long bond paper: 8.5 × 13 in.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 936;
const SIDE_MARGIN = 72;
const TEXT_WIDTH = PAGE_WIDTH - 2 * SIDE_MARGIN;
// The body starts where the form's title does and stops a little above the
// footer rule, which sits 829 pt down as in the form.
const TOP_MARGIN = 140;
const BOTTOM_MARGIN = 116;
const FOOTER_RULE_GAP = 9;
// One empty 12 pt line: the form's space between blocks.
const BLANK_LINE = 13.8;
// Lists in the form indent by a quarter inch.
const INDENT = 18;

// Paper colours, not screen colours: the form is printed in black.
const INK = '#000000';
const LINK = '#0563c1';
const MUTED = '#555555';
const WATERMARK = '#8c8c8c';

// The same on every CHED letterhead; the regional lines come from the office.
const REPUBLIC = 'Republic of the Philippines';
const NATIONAL_OFFICES = [
    'OFFICE OF THE PRESIDENT',
    'COMMISSION ON HIGHER EDUCATION',
];
const CHED_WEBSITE = 'www.ched.gov.ph';

// Longer words may break anywhere, so they cannot overflow a cell.
const LONG_WORD = 34;

// The code points Liberation Sans Narrow can draw (a subset of its cmap that
// covers typed English and Filipino); anything else uses the fallback face.
const COVERED: [number, number][] = [
    [0x09, 0x0a],
    [0x0d, 0x0d],
    [0x20, 0x7e],
    [0xa0, 0x17f],
    [0x2013, 0x2014],
    [0x2018, 0x201e],
    [0x2020, 0x2022],
    [0x2026, 0x2026],
    [0x20ac, 0x20ac],
    [0x2122, 0x2122],
];

const SEMESTERS = { 1: 'First Semester', 2: 'Second Semester' } as const;

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

type Margin = [number, number, number, number];

const tableLayout: CustomTableLayout = {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0.5,
    hLineColor: () => INK,
    vLineColor: () => INK,
    paddingLeft: () => 5.4,
    paddingRight: () => 5.4,
    paddingTop: () => 0,
    paddingBottom: () => 0,
};

export function buildMonitoringDocument(
    input: MonitoringPdfInput,
): TDocumentDefinitions {
    const { template } = input;

    return {
        pageSize: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        pageMargins: [SIDE_MARGIN, TOP_MARGIN, SIDE_MARGIN, BOTTOM_MARGIN],
        info: {
            title: `${template.title} – ${input.institutionName} – ${input.academicYear} ${SEMESTERS[input.semester]}`,
            author: input.institutionName,
            subject: 'GAD monitoring report',
            creator: 'PHLGADIS',
            producer: 'PHLGADIS',
        },
        language: 'en-PH',
        defaultStyle: { font: PDF_FONTS.body, fontSize: 12, color: INK },
        header: () => letterhead(input.office),
        footer: footer(input),
        watermark: input.documentCode
            ? undefined
            : {
                  text: 'DRAFT — NOT FOR SIGNATURE',
                  font: PDF_FONTS.body,
                  bold: true,
                  fontSize: 54,
                  color: WATERMARK,
                  opacity: 0.18,
              },
        content: [
            titleBlock(template),
            detailsBlock(input),
            requirementsTable(input),
            signatureBlock(input),
        ],
    };
}

/** "GAD-Monitoring-Report_Best-College-of-Polomolok-Inc_2026-2027_S1_Rev1.pdf" */
export function monitoringPdfFileName(input: MonitoringPdfInput): string {
    const institution = input.institutionName
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_-]+/g, '-')
        .slice(0, 60)
        .replace(/-+$/, '');
    const draft = input.documentCode ? '' : '_DRAFT';

    return `GAD-Monitoring-Report_${institution || 'HEI'}_${input.academicYear}_S${input.semester}_Rev${input.revisionNumber}${draft}.pdf`;
}

/** Whether any typed text needs the fallback face, whose files are large. */
export function needsFallbackFont(input: MonitoringPdfInput): boolean {
    return [
        input.institutionName,
        ...Object.values(input.details),
        ...Object.values(input.answers),
    ].some((text) => {
        // By code point, so characters outside the basic plane count once.
        for (const char of text) {
            if (!isCovered(char)) {
                return true;
            }
        }

        return false;
    });
}

/** "2026-09-29" → "September 29, 2026", without passing through a time zone. */
export function formatAccomplishedDate(value: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const month = match ? MONTHS[Number(match[2]) - 1] : undefined;

    return match && month ? `${month} ${Number(match[3])}, ${match[1]}` : '';
}

function letterhead(office: RegionOffice | null): Content {
    const offices = [...NATIONAL_OFFICES, office?.name, office?.city].filter(
        (line): line is string => Boolean(line),
    );

    return [
        // The seal fills the height of the form's image box, centred in it.
        {
            image: 'chedSeal',
            width: 80.5,
            height: 80.5,
            absolutePosition: { x: 79.3, y: 28.3 },
        },
        // As in the form, this mark reaches past the right margin.
        {
            image: 'bagongPilipinas',
            width: 78.3,
            height: 74.2,
            absolutePosition: { x: 491.6, y: 24.6 },
        },
        // Bonum's lines are taller than Bookman Old Style's, which sit 12.9 pt apart.
        {
            stack: [
                { text: REPUBLIC, lineHeight: 0.81 },
                ...offices.map((text) => ({
                    text,
                    bold: true,
                    lineHeight: 0.804,
                })),
            ],
            font: PDF_FONTS.letterhead,
            fontSize: 11,
            alignment: 'center',
            margin: [SIDE_MARGIN + 60, 34, SIDE_MARGIN + 60, 0],
        },
    ];
}

function footer(input: MonitoringPdfInput): DynamicContent {
    const office = input.office;
    const onRecord = Boolean(
        office?.address || office?.email || office?.website || office?.phone,
    );
    const contact: Content[] = [];

    if (office?.address) {
        contact.push({ text: office.address });
    }

    const web: Content[] = [];

    if (office?.email) {
        web.push(link(office.email, `mailto:${office.email}`), '; ');
    }

    if (office?.website) {
        web.push(office.website, ' | ');
    } else if (office?.email) {
        web.splice(-1, 1, ' | ');
    }

    // CHED's own site joins the office's details; with none on record, the
    // contact lines are left blank.
    if (onRecord) {
        web.push(link(CHED_WEBSITE, `https://${CHED_WEBSITE}`));
        contact.push(iconLine(office?.email ? 'envelope' : null, web));
    }

    if (office?.phone) {
        contact.push(iconLine('phone', [office.phone]));
    }

    const period = `${input.academicYear} · ${SEMESTERS[input.semester]} · Revision ${input.revisionNumber}`;
    const status = input.documentCode
        ? `Document code ${input.documentCode}`
        : 'Draft — not for signature';

    return (page, pages) => ({
        margin: [SIDE_MARGIN, FOOTER_RULE_GAP, SIDE_MARGIN, 0],
        stack: [
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 0,
                        x2: TEXT_WIDTH,
                        y2: 0,
                        lineWidth: 0.5,
                        lineColor: INK,
                    },
                ],
            },
            {
                stack: contact,
                font: PDF_FONTS.letterhead,
                fontSize: 9,
                lineHeight: 1.05,
                alignment: 'center',
                margin: [0, 1, 0, 0],
            },
            {
                text: `${period} · ${status} · Page ${page} of ${pages}`,
                fontSize: 7,
                color: MUTED,
                alignment: 'center',
                margin: [0, 5, 0, 0],
            },
        ],
    });
}

function link(text: string, target: string): Content {
    return { text, link: target, color: LINK, decoration: 'underline' };
}

/** A centred footer line led by a small icon, as in the form. */
function iconLine(icon: 'envelope' | 'phone' | null, text: Content[]): Content {
    if (!icon) {
        return { text };
    }

    return {
        columns: [
            { width: '*', text: '' },
            icon === 'envelope'
                ? { image: 'envelope', width: 10.5, margin: [0, -2, 2, 0] }
                : { image: 'phone', width: 12.75, margin: [0, -2, 2, 0] },
            { width: 'auto', text },
            { width: '*', text: '' },
        ],
        columnGap: 0,
    };
}

function titleBlock(template: MonitoringTemplate): Content {
    return {
        alignment: 'center',
        margin: [0, 0, 0, BLANK_LINE],
        stack: [
            { text: template.title, bold: true },
            ...template.subtitle.map((line) => ({
                text: line.map((run: TemplateRun) => ({
                    text: run.text,
                    bold: run.bold ?? false,
                })),
                fontSize: 10,
            })),
        ],
    };
}

function detailsBlock(input: MonitoringPdfInput): Content {
    const { labels } = input.template;
    const rows: [string, string][] = [
        [labels.institution, input.institutionName],
        [labels.address, input.details.address.trim()],
        [
            labels.accomplished_on,
            formatAccomplishedDate(input.details.accomplished_on),
        ],
    ];

    return {
        margin: [0, 0, 0, BLANK_LINE],
        bold: true,
        stack: rows.map(([label, value]) => ({
            columns: [
                { width: 100, text: `${label}:` },
                { width: '*', text: runs(value) },
            ],
        })),
    };
}

function requirementsTable(input: MonitoringPdfInput): Content {
    const { columns, sections } = input.template;
    const header: TableCell[] = [
        { text: columns.requirements, bold: true },
        {
            alignment: 'center',
            stack: [
                { text: columns.status, bold: true },
                { text: columns.instruction },
            ],
        },
    ];

    return {
        layout: tableLayout,
        table: {
            widths: ['*', '*'],
            body: [
                header,
                ...sections.flatMap((section) =>
                    sectionRows(section, input.answers),
                ),
            ],
        },
    };
}

function sectionRows(
    section: TemplateSection,
    answers: Record<string, string>,
): TableCell[][] {
    if (section.layout === 'single') {
        const heading: Content[] = [marker(section)];

        if (section.detail) {
            heading.push({
                text: runs(section.detail),
                alignment: 'justify',
                margin: [2 * INDENT, 0, 0, 0],
            });
        }

        return [
            [
                { stack: heading },
                answerCell(answers[section.items[0]?.key ?? ''] ?? ''),
            ],
        ];
    }

    if (section.layout === 'rows') {
        return [
            [marker(section), ''],
            ...section.items.map((item, index): TableCell[] => [
                hangingItem(index, item.label, INDENT),
                answerCell(answers[item.key] ?? ''),
            ]),
        ];
    }

    return [[combinedLabels(section), combinedAnswers(section, answers)]];
}

/** "1) Title" hangs its title after the number; "12. Title" runs on, as typed in the form. */
function marker(section: TemplateSection): Content {
    if (!hangs(section)) {
        return {
            text: runs(`${section.number} ${section.title}`),
            bold: section.bold,
            alignment: 'justify',
        };
    }

    return {
        columns: [
            { width: INDENT, text: section.number, bold: true },
            {
                width: '*',
                text: runs(section.title),
                bold: section.bold,
                alignment: 'justify',
            },
        ],
        columnGap: 0,
    };
}

function hangingItem(index: number, label: string, indent: number): Content {
    return {
        margin: [indent, 0, 0, 0],
        columnGap: 0,
        columns: [
            { width: INDENT, text: letter(index) },
            { width: '*', text: runs(label), alignment: 'justify' },
        ],
    };
}

/**
 * One row whose items are listed under the title. Under a numbered title
 * ("4)") the form runs them on at the first indent; under a typed "12." they
 * are a second-level list.
 */
function combinedLabels(section: TemplateSection): Content {
    return {
        stack: [
            marker(section),
            ...section.items.map((item, index): Content =>
                hangs(section)
                    ? {
                          text: runs(`${letter(index)}  ${item.label}`),
                          alignment: 'justify',
                          margin: [INDENT, 0, 0, 0],
                      }
                    : hangingItem(index, item.label, 3 * INDENT),
            ),
        ],
    };
}

/** Each item's answer under its own letter, as HEIs write them in the form. */
function combinedAnswers(
    section: TemplateSection,
    answers: Record<string, string>,
): TableCell {
    const [first] = section.items;

    if (section.items.length === 1 && first) {
        return answerCell(answers[first.key] ?? '');
    }

    if (section.items.every((item) => !answers[item.key]?.trim())) {
        return '';
    }

    return {
        stack: section.items.map((item, index): Content => ({
            margin: [0, index === 0 ? 0 : 6, 0, 0],
            stack: [
                {
                    text: runs(`${letter(index)} ${item.label}`),
                    bold: true,
                },
                ...paragraphs(answers[item.key] ?? ''),
            ],
        })),
    };
}

function answerCell(answer: string): TableCell {
    const lines = paragraphs(answer);

    return lines.length > 0 ? { stack: lines } : '';
}

/** Typed line breaks start new paragraphs; blank lines keep their space. */
function paragraphs(answer: string): Content[] {
    const text = answer.replace(/\r\n?/g, '\n').trim();

    if (text === '') {
        return [];
    }

    return text.split('\n').map((line): Content => ({
        text: line.trim() === '' ? ' ' : runs(line.trimEnd()),
        // Justifying would space out the letters of a word broken to fit.
        alignment: line.split(/\s+/).some((word) => word.length > LONG_WORD)
            ? 'left'
            : 'justify',
    }));
}

function signatureBlock(input: MonitoringPdfInput): Content {
    const { template, details } = input;

    return {
        unbreakable: true,
        fontSize: 11,
        margin: [0, 60, 0, 0],
        stack: template.signatories.map((signatory, index): Content => ({
            margin: [0, index === 0 ? 0 : 26, 0, 0],
            stack: [
                signatureLine(details[signatory.key].trim()),
                { text: signatory.role, margin: [0, 1, 0, 0] },
                { text: template.labels.signature },
            ],
        })),
    };
}

/** The name sits on the signature line, which is at least as long as the form's. */
function signatureLine(name: string): Content {
    const margin: Margin = [0, 0, 0, 0];

    return {
        layout: {
            hLineWidth: (index, node) =>
                index === node.table.body.length ? 0.75 : 0,
            vLineWidth: () => 0,
            hLineColor: () => INK,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 1,
        },
        table: {
            widths: ['auto'],
            body: [
                [
                    {
                        margin,
                        stack: [
                            {
                                text: name === '' ? ' ' : runs(name),
                                bold: true,
                            },
                            // Invisible, it keeps a short name's line long enough to sign on.
                            {
                                canvas: [
                                    {
                                        type: 'line',
                                        x1: 0,
                                        y1: 0,
                                        x2: 100,
                                        y2: 0,
                                        strokeOpacity: 0,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            ],
        },
    };
}

function hangs(section: TemplateSection): boolean {
    return section.number.endsWith(')');
}

function letter(index: number): string {
    return `${String.fromCharCode(97 + index)}.`;
}

function isCovered(char: string): boolean {
    const code = char.codePointAt(0) ?? 0;

    return COVERED.some(([from, to]) => code >= from && code <= to);
}

/**
 * Text as one run per word. pdfmake justifies by spreading space between runs,
 * so a word must not split at its hyphens or slashes. Characters the body face
 * lacks are set in the fallback face.
 */
function runs(text: string): Content {
    return (text.match(/\s*\S+\s*/g) ?? [text]).flatMap((word) => {
        const wrap =
            word.trim().length > LONG_WORD
                ? { wordBreak: 'break-all' as const }
                : { noWrap: true };

        return faces(word).map((part) => ({ ...part, ...wrap }));
    });
}

function faces(word: string): { text: string; font?: string }[] {
    const parts: { text: string; font?: string }[] = [];

    for (const char of word) {
        const font = isCovered(char) ? undefined : PDF_FONTS.fallback;
        const last = parts.at(-1);

        if (last && last.font === font) {
            last.text += char;
        } else {
            parts.push(font ? { text: char, font } : { text: char });
        }
    }

    return parts;
}
