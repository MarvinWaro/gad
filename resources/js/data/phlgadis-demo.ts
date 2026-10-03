export type DatasetKind = 'enrollment' | 'graduates';
export type SexFilter = 'all' | 'male' | 'female';
export type ProgramRecord = { program: string; male: number; female: number };
export type AcademicDataset = {
    year: string;
    enrollment: ProgramRecord[];
    graduates: ProgramRecord[];
};
/** Where the homepage's statistics come from (App\Support\StudentStatistics). */
export type StatisticsSource = {
    regions: string[];
    updated_at: string | null;
};
/** The homepage's statistics for one region, or every region. */
export type HomepageStatistics = {
    datasets: AcademicDataset[];
    source: StatisticsSource;
    /** The regions with figures, to choose from. */
    regions: { id: number; name: string }[];
    /** The chosen region's id, or '' for every region. */
    region: string;
    /** The chosen region's name, for the subtitle. */
    place: string | null;
};
export type MediaReference = {
    src?: string;
    alt: string;
    variant: 'campus' | 'community' | 'learning';
};
export type HeroSlideRecord = {
    id: string;
    title: string;
    description?: string | null;
    href?: string | null;
    media: MediaReference;
};
export type LawRecord = {
    slug: string;
    number: string;
    title: string;
    description: string;
    image: { src: string; alt: string };
    // Where to read the full text of the Act, and its size when it is a
    // file served from public/.
    document: string;
    documentBytes?: number;
    // The link text the old PHLGADIS resources list used.
    listName: string;
    // Section 1 short title and approval date, as the Act records them.
    shortTitle: string;
    approved: string;
    // An information brochure about the law, where one was supplied.
    brochure?: { href: string; bytes: number };
};
export type ResourceRecord = {
    id: 'terms' | 'acts' | 'videos' | 'issuances' | 'manuals';
    title: string;
    // Set once the area has a page; cards without one stay static.
    href?: string;
    summary?: string;
};

// Add a `src` such as `/images/hero/campus.jpg` to any media entry after the
// approved files are placed in public/. The illustration remains the fallback.
export const heroSlides: HeroSlideRecord[] = [
    {
        id: 'campus',
        title: 'Inclusive places. Shared possibilities.',
        description:
            'Higher education can create safer and more inclusive places for every member of the community.',
        media: {
            variant: 'campus',
            alt: 'Architectural campus illustration, replaceable image placeholder',
        },
    },
    {
        id: 'community',
        title: 'Voices together. Progress in motion.',
        description:
            'Stronger higher education communities are built through meaningful participation.',
        media: {
            variant: 'community',
            alt: 'Higher education community illustration, replaceable image placeholder',
        },
    },
    {
        id: 'learning',
        title: 'Knowledge shared. Change made possible.',
        description:
            'Shared learning helps turn knowledge into informed and lasting action.',
        media: {
            variant: 'learning',
            alt: 'Open learning material illustration, replaceable image placeholder',
        },
    },
];

export const laws: LawRecord[] = [
    {
        slug: 'ra-7877',
        number: 'RA 7877',
        title: 'Anti-Sexual Harassment Act of 1995',
        description: 'Explore learning resources about this GAD enabling law.',
        image: {
            src: '/assets/thumbnails/ra7877.jpg',
            alt: 'RA 7877 Anti-Sexual Harassment Law awareness artwork',
        },
        document: '/assets/document/ra7877.pdf',
        documentBytes: 121190,
        listName: 'Anti-Sexual Harassment Law',
        shortTitle: 'Anti-Sexual Harassment Act of 1995',
        approved: '1995-02-14',
    },
    {
        slug: 'ra-9262',
        number: 'RA 9262',
        title: 'Anti-Violence Against Women and Their Children Act',
        description: 'Explore learning resources about this GAD enabling law.',
        image: {
            src: '/assets/thumbnails/ra9262.jpg',
            alt: 'RA 9262 Violence Against Women and Their Children awareness artwork',
        },
        // public/assets/document/ra9262.pdf is an information brochure, not
        // the Act (see `brochure`), so the full text comes from LawPhil.
        document:
            'https://lawphil.net/statutes/repacts/ra2004/ra_9262_2004.html',
        listName: 'VAWC',
        shortTitle:
            'Anti-Violence Against Women and Their Children Act of 2004',
        approved: '2004-03-08',
        brochure: { href: '/assets/document/ra9262.pdf', bytes: 5978152 },
    },
    {
        slug: 'ra-9710',
        number: 'RA 9710',
        title: 'Magna Carta of Women',
        description: 'Explore learning resources about this GAD enabling law.',
        image: {
            src: '/assets/thumbnails/ra9710.jpg',
            alt: 'RA 9710 Magna Carta of Women awareness artwork',
        },
        document: '/assets/document/ra9710.pdf',
        documentBytes: 357676,
        listName: 'Magna Carta of Women',
        shortTitle: 'The Magna Carta of Women',
        approved: '2009-08-14',
    },
    {
        slug: 'ra-11313',
        number: 'RA 11313',
        title: 'Safe Spaces Act',
        description: 'Explore learning resources about this GAD enabling law.',
        image: {
            src: '/assets/thumbnails/ra11313.jpg',
            alt: 'RA 11313 Safe Spaces Act awareness artwork',
        },
        document: '/assets/document/ra11313.pdf',
        documentBytes: 4657048,
        listName: 'Safe Spaces Act',
        shortTitle: 'Safe Spaces Act',
        approved: '2019-04-17',
    },
];
export const resources: ResourceRecord[] = [
    {
        id: 'terms',
        title: 'Definition of Terms',
        href: '/resources/definition-of-terms',
        summary: '19 terms',
    },
    {
        id: 'acts',
        title: 'GAD Enabling Republic Acts',
        href: '/resources/gad-enabling-republic-acts',
        summary: '4 laws',
    },
    {
        id: 'videos',
        title: 'GAD Videos',
    },
    {
        id: 'issuances',
        title: 'Issuances',
        href: '/resources/issuances',
        summary: '2 issuances',
    },
    {
        id: 'manuals',
        title: 'Manuals',
        href: '/resources/manuals',
        summary: '2 manuals',
    },
];
