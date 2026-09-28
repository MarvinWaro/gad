// The What is PHLGADIS? and The Logo tabs of /about. The text is the old
// PHLGADIS site's (phlgadis.chedro12.com/phlgadis and /logo), word for word,
// with its bold terms. Two presentation changes, no rewording:
// - The live page spells the system "PHILGADIS" twice; this follows the
//   user's copy of the page, which reads PHLGADIS.
// - The old Logo page broke one sentence about the PHLGADIS logo across
//   three paragraphs; here it is one paragraph.

/** A paragraph with some terms in bold, as the old page set them. */
export type RichText = (string | { strong: string })[];

export const whatIsPhlgadis: string[] = [
    'The Commission on Higher Education has a long history in championing the cause for Gender and Development. On July 2, 2010, the CHED GAD Focal Committee and Secretariat were created, initiating the GAD program of the Commission in coordination with other government entities and co-convenors from public and private Higher Education Institutions (HEIs). Thereafter, the GAD Focal Point System of CHED was created with a commitment to undertake all necessary and appropriate measures to advance the cause of Gender and Development. As a result, the Commission formulated CHED Memorandum Order No.1 Series of 2015 to serve as Policy Guidelines, guiding all HEIs in their commitment to create a safe and inclusive environment for all genders.',
    'In October 2011, the 1st Higher Education Summit on Gender Issues was held in UP Bahay ng Alumni, Quezon City, with the theme “A Call for Partnership among Higher Education Institutions to Strengthen Gender Equality, Development, and Peace.” The objective was to provide awareness and good practices in school policies, curriculum and research development, and programs and services pertaining to gender and development.',
    'In 2017, the Conference on Gender Mainstreaming in Higher Education in ASEAN was held in Sofitel Philippine Plaza Manila. The objectives of the conference included presenting the status of Gender Mainstreaming in Higher Education in various ASEAN countries and eliminating gender-based violence experienced by the academic community, among others.',
    'The continued efforts of the Commission on Higher Education in championing the cause for Gender and Development were acknowledged by the Philippine Commission on Women when they received the Bronze GADtimpala Award in 2018.',
    'Today, the Commission on Higher Education has not stopped in seeking a future where gender-based violence in Higher Education Institutions and the Commission itself is eliminated, leading to the development of this web application entitled PHLGADIS, or the Philippine Higher Education Gender and Development Information System.',
    "PHLGADIS stands for the Philippine Higher Education Gender and Development Information System, part of the agency's advocacy on Gender and Development.",
    "By consolidating sex-disaggregated data on higher education and gathering the best practices in gender mainstreaming of higher education institutions (HEIs), PHLGADIS will facilitate CHED's effort in integrating gender equality, diversity, and inclusiveness in Philippine higher education.",
    'PHLGADIS centers around four enabling laws written with the intent to protect all people from sexual violence and discrimination. These laws are the Anti-Sexual Harassment Act of 1995 (RA No. 7877), Anti-Violence Against Women and Their Children (RA 9262), Magna Carta for Women (RA 9710), and the Anti-Sexual Harassment Act and Safe Spaces Act (11313). These four were chosen to ensure that the data on sexual harassment and other violations include not only females but also males, regardless of their gender identity. RA 7877 was chosen to address sexual harassment occurring in workspaces and students, especially those that happen in exchange for employment in higher education institutions or scholarship grants. RA 9262 was included because unemancipated minors may still be enrolled in college, and women are a significant workforce in higher education institutions and the Commission on Higher Education, thus their rights and interests must be protected. RA 9710 was also chosen due to the discrimination or unfair treatment against women that may still exist in higher education institutions, especially among pregnant students and employees who do not receive their rightful benefits during pregnancy. Finally, RA 11313, or the Safe Spaces Act, was incorporated to assess how safe students are on university campuses. RA 11313 protects everyone, regardless of their gender or sexual orientation, as explicitly written.',
    'PHLGADIS is accessible to individual universities and colleges, public and private of Region 12. It is designed to facilitate policy reforms and program initiatives of CHEDRO XII and the different universities and colleges so that these are data-driven and evidence-based.',
];

export const chedLogo: RichText[] = [
    [
        'The ',
        { strong: 'CHED LOGO' },
        ' is a representation of how Philippine higher education evolved.',
    ],
    [
        'The ',
        { strong: 'pyramid' },
        ' represents the ideal three-level, manpower structure of the country, comprising of basic level skills, middle or semi-skilled workers, and high or professional levels of human resource located at the apex of the pyramid and the primary concern of higher education.',
    ],
    [
        'The ',
        { strong: 'human silhouette' },
        ' inside the pyramid represents human resources development of every Filipino to become productive citizens of the country.',
    ],
    [
        'The ',
        { strong: 'rising sun' },
        ' symbolizes the dawning of a new era in higher education with the creation of CHED. With the emergence of CHED, higher education was given the much needed attention and appropriate reforms implemented which jumpstarted the development of higher education as the prime mover in nation-building.',
    ],
    [
        'The ',
        { strong: 'sun’s rays' },
        ' signify the perpetual thirst for knowledge and expansion of learning throughout all the regions of the country.',
    ],
    [
        'The ',
        { strong: 'color triad: red, yellow' },
        ' and ',
        { strong: 'blue' },
        ' correspond to the colors of the Philippine flags as CHED was created to be the main advocate and pillar of nation building.',
    ],
    [
        'The ',
        { strong: 'year 1994' },
        ' indicates the year when CHED was created by law. On May 18, 1994, CHED was established through Republic Act No. 7722, otherwise known as the “Higher Education Act of 1994”. The CHED is an attached.',
    ],
];

export const phlgadisLogo: RichText = [
    'The ',
    { strong: 'PHLGADIS logo' },
    ' is presented as part of CHED’s effort for Gender Equality by having the CHED Branding Logo alongside the PHLGADIS’ ',
    { strong: '“PHL”' },
    ' and ',
    { strong: '“IS”' },
    ' being color schemed with CHED’s two of the three iconic colors of its branding that represents the Philippines flag, while ',
    { strong: '“GAD”' },
    ' is given the pinkish purple color that represents the color of Gender and Development.',
];
