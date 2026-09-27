import type { LawRecord } from './phlgadis-demo';

export type ManualRecord = {
    slug: string;
    // As the old PHLGADIS list shows it.
    title: string;
    // What the document says about itself.
    details: string[];
    // The date the assessment was administered, where the document records it.
    administered?: string;
    document: string;
    documentBytes: number;
    // Laws the document itself names.
    relatedLaws: LawRecord['slug'][];
};

export const manuals: ManualRecord[] = [
    {
        slug: 'enhanced-gmef',
        title: 'Enhanced GMEF of CHED 2020 Manual',
        // Page footers: "A Toolkit on the Enhanced Gender Mainstreaming
        // Evaluation Framework, © Copyright 2016 - Philippine Commission on
        // Women". The score sheet assesses the Commission on Higher Education,
        // "Date Administered: October 01 2020".
        details: [
            'Enhanced Gender Mainstreaming Evaluation Framework',
            'Toolkit by the Philippine Commission on Women',
        ],
        administered: '2020-10-01',
        document: '/assets/document/gmef.pdf',
        documentBytes: 969655,
        // Cites the MCW and its IRR (Sec. 37-C), and lists "Guidelines on the
        // IRR of the Safe Spaces Act" among its evidence.
        relatedLaws: ['ra-9710', 'ra-11313'],
    },
    {
        slug: 'gad-capacity-assessment-form',
        title: 'GAD Capacity Assessment Form Manual',
        // The form's header.
        details: [
            'Philippine Commission on Women',
            'National Gender and Development Resource Program',
        ],
        document: '/assets/document/gcaf.pdf',
        documentBytes: 537110,
        // Asks about familiarity with Republic Acts 7877, 9262 and 9710.
        relatedLaws: ['ra-7877', 'ra-9262', 'ra-9710'],
    },
];
