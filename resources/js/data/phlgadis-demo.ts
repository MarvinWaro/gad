export type DatasetKind = 'enrollment' | 'graduates';
export type SexFilter = 'all' | 'male' | 'female';
export type ProgramRecord = { program: string; male: number; female: number };
export type AcademicDataset = {
    year: string;
    enrollment: ProgramRecord[];
    graduates: ProgramRecord[];
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
};
export type ContentRecord = {
    id: string;
    category: string;
    title: string;
    description: string;
    media: MediaReference;
};
export type ResourceRecord = { title: string; description: string };

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

// Illustrative distributions, not official program-level data. Totals match the
// supplied design brief. Replace these fixtures with verified Inertia props.
export const datasets: AcademicDataset[] = [
    {
        year: '2025–2026',
        enrollment: [
            { program: 'Education', male: 17000, female: 38000 },
            { program: 'Business Administration', male: 18500, female: 34000 },
            { program: 'Criminal Justice', male: 21500, female: 9000 },
            { program: 'IT-Related', male: 12500, female: 8000 },
            { program: 'Medical and Allied', male: 3000, female: 15000 },
            { program: 'Engineering', male: 8500, female: 4000 },
            { program: 'Agricultural', male: 4800, female: 5200 },
            { program: 'Other programs', male: 9937, female: 18886 },
        ],
        graduates: [
            { program: 'Education', male: 2500, female: 6100 },
            { program: 'Business Administration', male: 2000, female: 4900 },
            { program: 'Criminal Justice', male: 2400, female: 800 },
            { program: 'IT-Related', male: 1400, female: 700 },
            { program: 'Medical and Allied', male: 500, female: 2500 },
            { program: 'Engineering', male: 900, female: 400 },
            { program: 'Agricultural', male: 600, female: 700 },
            { program: 'Other programs', male: 1500, female: 4090 },
        ],
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
    },
];
export const stories: ContentRecord[] = [
    {
        id: 'campus',
        category: 'Campus initiatives',
        title: 'Making room for a more inclusive campus.',
        description:
            'A preview of the stories this platform will share: campus-led efforts to make gender responsiveness part of everyday learning.',
        media: { alt: 'Campus illustration placeholder', variant: 'campus' },
    },
    {
        id: 'community',
        category: 'Community',
        title: 'Progress starts with a conversation.',
        description:
            'A sample story about bringing students, educators, and communities together to talk about inclusion.',
        media: {
            alt: 'Community illustration placeholder',
            variant: 'community',
        },
    },
    {
        id: 'learning',
        category: 'GAD in practice',
        title: 'Shared knowledge. Lasting change.',
        description:
            'A sample story about creating space for gender and development learning across higher education.',
        media: {
            alt: 'Learning illustration placeholder',
            variant: 'learning',
        },
    },
];
export const resources: ResourceRecord[] = [
    {
        title: 'Policies & guidelines',
        description: 'Guidance for gender-responsive institutions.',
    },
    {
        title: 'Publications',
        description: 'Perspectives and research on gender and development.',
    },
    {
        title: 'Reports & statistics',
        description: 'Evidence to inform your next decision.',
    },
    {
        title: 'Learning materials',
        description: 'Build understanding. Bring it into practice.',
    },
];
