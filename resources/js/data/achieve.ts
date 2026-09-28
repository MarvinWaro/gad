// CHED's A.C.H.I.E.V.E. Agenda, word for word as ched.gov.ph/achieve-agenda
// lists it on 2026-09-28. The site turns away automated requests, so the
// text was copied from a screenshot of that page; the four thrust
// descriptions also match a search snippet of it. "efficient,transparent"
// (no space) is CHED's own text.

export type AchieveItem = {
    letter: string;
    role: 'thrust' | 'enabler';
    title: string;
    description: string;
};

export const achieveSource = 'https://ched.gov.ph/achieve-agenda';

export const achieveAgenda: AchieveItem[] = [
    {
        letter: 'A',
        role: 'thrust',
        title: 'Advanced and Accessible Lifelong Learning',
        description:
            'Expanding flexible, affordable, and inclusive learning opportunities at every stage of life.',
    },
    {
        letter: 'C',
        role: 'thrust',
        title: 'Centralized One-Nation Human Capital Development',
        description:
            'Aligning higher education with labor market needs and national development goals.',
    },
    {
        letter: 'H',
        role: 'thrust',
        title: 'Harmonized SDG-Based Research, Development, and Innovation',
        description:
            'Supporting research that contributes to national progress and the Sustainable Development Goals (SDGs).',
    },
    {
        letter: 'I',
        role: 'thrust',
        title: 'Inclusive and Impact-driven Internationalization',
        description:
            'Strengthening transnational higher education, global academic partnerships, mobility, and cross-border learning.',
    },
    {
        letter: 'E',
        role: 'enabler',
        title: 'Expanded and Integrated Real-Time Data Collection and Analytics',
        description:
            'Using timely, accurate data to guide policies, planning, and decision-making.',
    },
    {
        letter: 'V',
        role: 'enabler',
        title: 'Vitalized Policies, Internal Systems, and Governance',
        description:
            'Strengthening CHED’s policies and internal systems to promote efficient,transparent, and accountable governance, and ensuring that policy development is relevant, responsive, and aligned with the needs of the nation.',
    },
    {
        letter: 'E',
        role: 'enabler',
        title: 'Effective and Efficient Public Service',
        description:
            'Delivering timely, responsive, and people-centered services that meet the needs of all stakeholders.',
    },
];
