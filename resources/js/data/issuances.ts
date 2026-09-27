import type { LawRecord } from './phlgadis-demo';

export type IssuanceRecord = {
    slug: string;
    // Number and title as the old PHLGADIS list shows them:
    // "CMO No. 01 S. 2015 - Establishing the Policies and Guidelines…".
    number: string;
    title: string;
    // The date the document says it was issued, where it states one.
    issued?: string;
    document: string;
    documentBytes: number;
    // Laws the document itself names as its basis or applies.
    relatedLaws: LawRecord['slug'][];
};

export const issuances: IssuanceRecord[] = [
    {
        slug: 'cmo-01-s-2015',
        number: 'CMO No. 01 S. 2015',
        title: 'Establishing the Policies and Guidelines on Gender and Development in CHED and HEIs',
        // "Issued this 26th day of January, 2015" (page 32 of 32).
        issued: '2015-01-26',
        document: '/assets/document/cmo_no._01_s._2015.pdf',
        documentBytes: 6658694,
        // RA 9710 is CHED's mandate (page 2), RA 7877 frames its sexual
        // harassment rules (page 26), and Rule II applies RA 9262 (page 32).
        relatedLaws: ['ra-7877', 'ra-9262', 'ra-9710'],
    },
    {
        slug: 'cmo-03-s-2022',
        number: 'CMO No. 3 S. 2022',
        title: 'Guidelines on Gender-Based Sexual Harassment in Higher Education Institutions',
        document: '/assets/document/cmo_no._3_s._2022.pdf',
        documentBytes: 12829367,
        // Issued "in accordance with Sections 25 and 33 of Republic Act
        // No. 11313" (page 1). The document states no issue date.
        relatedLaws: ['ra-11313'],
    },
];
