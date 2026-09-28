// The 17 Sustainable Development Goals, in order: goal N's icon is
// /assets/sdg/web/sdg-0N.webp. Each links to its page on the UN's site, the
// same addresses the old PHLGADIS SDG page used (each checked on 2026-09-28).
// App\Enums\SustainableDevelopmentGoal validates the numbers on posts.
//
// The UN's icon guidelines (September 2023, pp. 4 and 65–66) ask that each
// icon is shown whole and square, never cropped, recoloured, shadowed or
// stretched, and that a group sits in one line or aligned left.

export type SustainableGoal = {
    number: number;
    name: string;
    href: string;
    image: string;
};

export const sustainableGoals: SustainableGoal[] = [
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

/** The goals with these numbers, in the goals' own order. */
export function sdgsFor(numbers: readonly number[]): SustainableGoal[] {
    return sustainableGoals.filter((goal) => numbers.includes(goal.number));
}

// The UN asks non-UN material that uses the icons to link its SDG site and
// carry this statement, word for word
// (un.org/sustainabledevelopment/news/communications-material/, 2026-09-28).
export const sdgSite = 'https://www.un.org/sustainabledevelopment';

export const sdgDisclaimer =
    'The content of this publication has not been approved by the United Nations and does not reflect the views of the United Nations or its officials or Member States.';
