// The GAD Herstory timeline on /about/gad-herstory. The text is the old
// PHLGADIS timeline's (phlgadis.chedro12.com/gad_herstory), word for word,
// with changes agreed on 2026-09-28:
// - "RA 92622" reads RA 9262, and "educations sector" reads education sector.
// - The old page had two March 2010 "Magna Carta of Women" entries; the
//   shorter one is left out because the longer one repeats its sentence.
// The old page captioned every photo "Event Image"; the alt text here says
// what each photo shows.

export type HerstoryEntry = {
    id: string;
    /** As the old timeline labels it. */
    date: string;
    /** The same date for <time dateTime>. */
    datetime: string;
    title: string;
    /** One entry per line; the old page broke the mandate lists into lines. */
    lines: string[];
    /** Picks the icon on the timeline's axis. */
    kind: 'convention' | 'law' | 'rules' | 'office' | 'event' | 'award';
    image?: { src: string; alt: string };
};

export const herstory: HerstoryEntry[] = [
    {
        id: 'cedaw-1981',
        date: 'August 1981',
        datetime: '1981-08',
        title: 'CEDAW',
        lines: [
            'The Philippines as a member of the United Nations, conforms to the Convention on the Elimination of all Forms of Discrimination Against Women (CEDAW).',
        ],
        kind: 'convention',
        image: { src: '/assets/img/cedaw.png', alt: 'The CEDAW emblem' },
    },
    {
        id: 'ra-7192',
        date: 'February 1992',
        datetime: '1992-02',
        title: 'RA 7192',
        lines: [
            'The Republic Act 7192 or Women in Development and Nation Building Act was enacted by the Republic of the Philippines.',
        ],
        kind: 'law',
    },
    {
        id: 'ra-7722',
        date: 'May 1994',
        datetime: '1994-05',
        title: 'RA 7722',
        lines: [
            'Republic Act 7722 was enacted for the creation of the Commission on Higher Education.',
        ],
        kind: 'law',
    },
    {
        id: 'ra-7877',
        date: 'February 1995',
        datetime: '1995-02',
        title: 'RA 7877',
        lines: [
            'Republic Act 7877 or Anti Sexual Harassment Act of 1995 was enacted.',
        ],
        kind: 'law',
    },
    {
        id: 'beijing-1995',
        date: 'September 1995',
        datetime: '1995-09',
        title: 'Adopts CEDAW and BPFA',
        lines: [
            'The Fourth UN World Conference on Women was held in Beijing alongside the Beijing Platform for Action. The Philippines adopts the CEDAW and BPFA.',
        ],
        kind: 'convention',
        image: {
            src: '/assets/img/beijing.png',
            alt: 'Delegates under the Fourth World Conference on Women banner, Beijing, 4–15 September 1995',
        },
    },
    {
        id: 'ra-9262',
        date: 'March 2004',
        datetime: '2004-03',
        title: 'RA 9262',
        lines: [
            'RA 9262 or The Anti Violence Against Women and Their Children Act of 2004 was enacted.',
        ],
        kind: 'law',
    },
    {
        id: 'ra-9710',
        date: 'September 2009',
        datetime: '2009-09',
        title: 'RA 9710',
        lines: [
            'The Republic Act No. 9710 or Magna Carta of Women was enacted.',
        ],
        kind: 'law',
    },
    {
        id: 'mcw-irr-2010',
        date: 'March 2010',
        datetime: '2010-03',
        title: 'Magna Carta of Women',
        lines: [
            'The Implementing Rules and Regulations for the Magna Carta of Women was approved. CHED has been mandated to:',
            '-Develop and promote gender-sensitive curriculum;',
            '-Ensure that educational institutions implement a capacity building program on gender, peace and human rights education for their officials, faculty and non-teaching staff and personnel, promote partnerships between and among players of the education sector;',
            '-Promote partnerships between and among players of the education sector;',
        ],
        kind: 'rules',
    },
    {
        id: 'vaw-2010',
        date: 'March 2010',
        datetime: '2010-03',
        title: 'Violence against Women',
        lines: [
            '-Encourage advertising industry and other similar institutions to provide free use of space and installation of displays for schools, colleges and universities for campaigns to end discrimination and violence against women;',
            '-Guarantee that educational institutions provide scholarship programs for marginalized women and girls set minimum standards for programs and institutions of higher learning.',
        ],
        kind: 'rules',
    },
    {
        id: 'gad-focal-2010',
        date: 'July 2010',
        datetime: '2010-07',
        title: 'Creation of CHED GAD Focal',
        lines: [
            'Creation of the CHED GAD Focal Committee and Secretariat. Approved the constitution of the GAD Focal Point System.',
        ],
        kind: 'office',
    },
    {
        id: 'summit-2011',
        date: 'October 2011',
        datetime: '2011-10',
        title: 'Education Summit',
        lines: [
            '1st Higher Education Summit on Gender Issues was held in UP Bahay ng Alumni, Quezon City.',
        ],
        kind: 'event',
        image: {
            src: '/assets/img/october.png',
            alt: 'Participants under the 1st Higher Education Summit on Gender Issues banner, UP Bahay ng Alumni',
        },
    },
    {
        id: 'asean-2017',
        date: 'November 2017',
        datetime: '2017-11',
        title: 'Gender Mainstreaming',
        lines: [
            'Conference on Gender Mainstreaming in Higher Education in ASEAN was held in Sofitel Philippine Plaza Manila.',
        ],
        kind: 'event',
        image: {
            src: '/assets/img/nov.png',
            alt: 'Participants on stage under the Conference on Gender Mainstreaming in Higher Education in ASEAN banner',
        },
    },
    {
        id: 'gadtimpala-2019',
        date: 'August 2019',
        datetime: '2019-08',
        title: 'GADtimpala Award 2018',
        lines: [
            'CHED is recognized by the PCW and was given the BRONZE award for the GADtimpala Award 2018.',
        ],
        kind: 'award',
        image: {
            src: '/assets/img/aug.png',
            alt: 'A group on stage under the “MCW @ 10: Empowering the Filipino Women” banner',
        },
    },
];

/** The years the timeline covers, e.g. "1981 to 2019". */
export const herstorySpan = `${herstory[0].datetime.slice(0, 4)} to ${herstory[herstory.length - 1].datetime.slice(0, 4)}`;
