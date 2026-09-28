import { achieveAgenda, achievePage, type AchieveItem } from '@/data/achieve';
import { herstory } from '@/data/herstory';
import { sustainableGoals } from '@/data/sdgs';

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
        href: achievePage,
        summary: `${agendaCount('thrust')} thrusts, ${agendaCount('enabler')} enablers`,
    },
    {
        id: 'goals',
        title: 'Sustainable Development Goals',
        href: '/about#goals',
        summary: `${sustainableGoals.length} goals`,
    },
];
