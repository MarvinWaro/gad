// The HEI home's guided tour (hooks/use-hei-tour.ts): its steps, in order.
// Each step points at the element marked data-tour="…"; one with no target
// sits in the middle of the screen. Nothing here touches the page, so the
// list tests in node.

export type TourStep = {
    /** The data-tour name it points at; none for a welcome in the middle. */
    target?: string;
    title: string;
    description: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
};

/**
 * Every step any HEI account may see. Monitoring and Quick links are for
 * the HEI's focal persons; the left rail's law surveys show from 1280px and
 * the surveys panel below that; the top tabs from 1024px and the bottom
 * bar below.
 */
export function heiTourSteps(firstName: string): TourStep[] {
    return [
        {
            title: `Welcome to PHLGADIS, ${firstName}`,
            description:
                'A one-minute look around your home, and where to find what you need.',
        },
        {
            target: 'composer',
            title: 'Share a GAD activity',
            description:
                "Post your campus's gender and development work: add photos, tag people and a feeling, and the SDGs and A.C.H.I.E.V.E. items it supports.",
        },
        {
            target: 'feed-tabs',
            title: 'Your feed',
            description:
                "Everyone's posts, your region's, or only the people you follow.",
        },
        {
            target: 'surveys',
            title: 'Law surveys',
            description:
                'Open a survey, or copy its link for your students and staff. Each shows how many responses came from your HEI.',
        },
        {
            target: 'events',
            title: 'Events',
            description:
                "CHED's GAD events for your region. Join one; at the venue, your Virtual ID's QR code checks you in.",
        },
        {
            target: 'quest',
            title: 'GAD Quest',
            description:
                'Short quizzes on gender and development that earn badges for your profile.',
        },
        {
            target: 'monitoring',
            title: 'Monitoring',
            description:
                "Your HEI's monitoring reports and records, and the GAD Training and Compliance surveys.",
        },
        {
            target: 'quick-links',
            title: 'Quick links',
            description:
                'Shortcuts to your Monitoring Report, the GAD Training and Compliance surveys, and your Records.',
        },
        {
            target: 'bell',
            title: 'Notifications',
            description:
                'Comments and reactions on your posts, event news and other updates arrive here.',
        },
        {
            target: 'account',
            title: 'You',
            description:
                'Your profile, Virtual ID and settings. Take this tour again from here any time.',
        },
    ];
}

/**
 * The steps whose target is on screen now (`isVisible`), so one tour fits
 * a phone and a computer, a focal person and everyone else.
 */
export function visibleSteps(
    steps: TourStep[],
    isVisible: (target: string) => boolean,
): TourStep[] {
    return steps.filter(
        (step) => step.target === undefined || isVisible(step.target),
    );
}

/** The home's address with the tour asked for, as the replay links use it. */
export function withTour(homeUrl: string): string {
    return `${homeUrl}?tour=1`;
}
