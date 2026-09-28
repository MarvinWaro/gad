import { achieveAgenda, type AchieveItem } from '@/data/achieve';
import { herstory } from '@/data/herstory';

// The About topics, shown as cards on the homepage: GAD Herstory opens its
// timeline page, and the other topics with content open their tab of the
// /about page (What is PHLGADIS? covers the logo tab too).

export type AboutTopic = {
    id: 'herstory' | 'organization' | 'phlgadis' | 'achieve' | 'goals';
    title: string;
    // Set once the topic has content; cards without one stay static.
    href?: string;
    summary?: string;
};

// The 17 Sustainable Development Goals, in order: goal N's tile is
// /assets/sdg/web/sdg-0N.webp. Each links to its page on the UN's site, the
// same addresses the old PHLGADIS SDG page used (each checked on 2026-09-28).
export const sustainableGoals = [
    ['No Poverty', 'poverty'],
    ['Zero Hunger', 'hunger'],
    ['Good Health and Well-Being', 'health'],
    ['Quality Education', 'education'],
    ['Gender Equality', 'gender-equality'],
    ['Clean Water and Sanitation', 'water-and-sanitation'],
    ['Affordable and Clean Energy', 'energy'],
    ['Decent Work and Economic Growth', 'economic-growth'],
    [
        'Industry, Innovation and Infrastructure',
        'infrastructure-industrialization',
    ],
    ['Reduced Inequalities', 'inequality'],
    ['Sustainable Cities and Communities', 'cities'],
    [
        'Responsible Consumption and Production',
        'sustainable-consumption-production',
    ],
    ['Climate Action', 'climate-change'],
    ['Life Below Water', 'oceans'],
    ['Life on Land', 'biodiversity'],
    ['Peace, Justice and Strong Institutions', 'peace-justice'],
    ['Partnerships for the Goals', 'globalpartnerships'],
].map(([name, slug], index) => ({
    number: index + 1,
    name,
    href: `https://www.un.org/sustainabledevelopment/${slug}/`,
    image: `/assets/sdg/web/sdg-${String(index + 1).padStart(2, '0')}.webp`,
}));

const agendaCount = (role: AchieveItem['role']) =>
    achieveAgenda.filter((item) => item.role === role).length;

export const aboutTopics: AboutTopic[] = [
    {
        id: 'herstory',
        title: 'GAD Herstory',
        href: '/about/gad-herstory',
        summary: `${herstory.length} milestones`,
    },
    // The earlier site's chart has not been supplied yet.
    { id: 'organization', title: 'Organizational Chart' },
    {
        id: 'phlgadis',
        title: 'What is PHLGADIS?',
        href: '/about#phlgadis',
        summary: 'Overview and logo',
    },
    {
        id: 'achieve',
        title: 'A.C.H.I.E.V.E. Agenda',
        href: '/about#achieve',
        summary: `${agendaCount('thrust')} thrusts, ${agendaCount('enabler')} enablers`,
    },
    {
        id: 'goals',
        title: 'Sustainable Development Goals',
        href: '/about#goals',
        summary: `${sustainableGoals.length} goals`,
    },
];
