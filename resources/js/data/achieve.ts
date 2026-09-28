// CHED's A.C.H.I.E.V.E. Agenda, word for word as ched.gov.ph/achieve-agenda
// lists it on 2026-09-28. The site turns away automated requests, so the
// text was copied from a screenshot of that page; the four thrust
// descriptions also match a search snippet of it. "efficient,transparent"
// (no space) is CHED's own text.
//
// Each item's `code` is our own stable identifier for tagging posts, the
// same values as App\Enums\AchieveItem; keep the two in step.

export type AchieveCode =
    | 'lifelong-learning'
    | 'human-capital'
    | 'research-innovation'
    | 'internationalization'
    | 'data-analytics'
    | 'governance'
    | 'public-service';

export type AchieveItem = {
    code: AchieveCode;
    letter: string;
    role: 'thrust' | 'enabler';
    title: string;
    description: string;
};

export const achieveSource = 'https://ched.gov.ph/achieve-agenda';

/** Our own page for the agenda: its tab on /about. */
export const achievePage = '/about#achieve';

export const achieveAgenda: AchieveItem[] = [
    {
        code: 'lifelong-learning',
        letter: 'A',
        role: 'thrust',
        title: 'Advanced and Accessible Lifelong Learning',
        description:
            'Expanding flexible, affordable, and inclusive learning opportunities at every stage of life.',
    },
    {
        code: 'human-capital',
        letter: 'C',
        role: 'thrust',
        title: 'Centralized One-Nation Human Capital Development',
        description:
            'Aligning higher education with labor market needs and national development goals.',
    },
    {
        code: 'research-innovation',
        letter: 'H',
        role: 'thrust',
        title: 'Harmonized SDG-Based Research, Development, and Innovation',
        description:
            'Supporting research that contributes to national progress and the Sustainable Development Goals (SDGs).',
    },
    {
        code: 'internationalization',
        letter: 'I',
        role: 'thrust',
        title: 'Inclusive and Impact-driven Internationalization',
        description:
            'Strengthening transnational higher education, global academic partnerships, mobility, and cross-border learning.',
    },
    {
        code: 'data-analytics',
        letter: 'E',
        role: 'enabler',
        title: 'Expanded and Integrated Real-Time Data Collection and Analytics',
        description:
            'Using timely, accurate data to guide policies, planning, and decision-making.',
    },
    {
        code: 'governance',
        letter: 'V',
        role: 'enabler',
        title: 'Vitalized Policies, Internal Systems, and Governance',
        description:
            'Strengthening CHED’s policies and internal systems to promote efficient,transparent, and accountable governance, and ensuring that policy development is relevant, responsive, and aligned with the needs of the nation.',
    },
    {
        code: 'public-service',
        letter: 'E',
        role: 'enabler',
        title: 'Effective and Efficient Public Service',
        description:
            'Delivering timely, responsive, and people-centered services that meet the needs of all stakeholders.',
    },
];

/** The items with these codes, in the agenda's own order. */
export function achieveItemsFor(codes: readonly AchieveCode[]): AchieveItem[] {
    return achieveAgenda.filter((item) => codes.includes(item.code));
}
