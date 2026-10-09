// The /help/faq page, reached from the header's "Need Help?" menu. The text
// is the old PHLGADIS FAQ page's (phlgadis.chedro12.com/faq), word for word,
// with three changes agreed on 2026-09-28:
// - "What data do the surveys collect?" is answered with how the new survey
//   works, in the words its consent step, details step and confirmation page
//   use, and names the office running the site (config/phlgadis.php). The
//   old answer said an email is collected; the new survey asks for one, and
//   giving it is optional.
// - "Republic Act 78777" reads 7877.
// - The RA 7877 quote reads "its human resources", as Section 2 of the Act
//   does (LawPhil). The RA 9262 and RA 11313 quotes already match theirs.

import type { SiteOperator } from '@/types/site';

export type FaqItem = {
    /** The anchor for links straight to this answer: /help/faq#{id}. */
    id: string;
    question: string;
    /** Built from the site's operator when the answer names it. */
    answer: string | ((operator: SiteOperator) => string);
};

/** The old page's opening: what PHLGADIS is for, and its objectives. */
export const faqIntro = {
    purpose:
        'The Philippine Higher Education Gender and Development Information System (PHLGADIS) is aimed at addressing Gender and Development data collection within the Commission on Higher Education, Central and Regional Offices, and Higher Education Institutions in the country.',
    objectivesLead: 'The objectives of the system are the following:',
    objectives: [
        'Collect relevant GAD data from HEIs',
        'Analyze significant data on GAD issues',
        'Generate information for decision-making and policy formulation',
        'Provide GAD data information for public awareness',
        'Identify GAD issues and concerns for research development',
        'Provide information on necessary measures to prevent gender-based sexual harassment in schools',
        'Educate stakeholders on their roles as key partners in implementing laws',
        'Inform agency partners on the importance of creating implementation guidelines in their respective agencies and jurisdictions',
    ],
    outcome:
        'Through the collected data, Gender Mainstreaming, Gender Responsive Curricular Program, and Gender Responsive Research Program can be accelerated in their conduct and implementation and streamlined with their respective programs, projects, and activities. The system can assist in the policy recommendations of the Commission on Higher Education regarding gender and development in higher education institutions.',
};

export const faqs: FaqItem[] = [
    {
        id: 'bulletin',
        question: 'What is the bulletin about ?',
        answer: 'It is an interactive slideshow of banners that preview the various activities and events for Gender and Development promulgated by the Higher Education Institutions and the Commission on Higher Education.',
    },
    {
        id: 'survey-data',
        question: 'What data do the surveys collect?',
        answer: (operator) =>
            `Each survey states what it collects in its privacy notice, shown before you begin. No name is collected, giving an email is optional, and no IP address or browser details are stored with your response. After you submit, you receive a reference code that you can use to ask ${operator.name} to access or delete your response.`,
    },
    {
        id: 'ra-7877',
        question:
            'Republic Act 7877 or Anti-Sexual Harassment Act, what is it about?',
        answer: 'According to Section 2 of RA 7877, "The State shall value the dignity of every individual, enhance the development of its human resources, guarantee full respect for human rights, and uphold the dignity of workers, employees, applicants for employment, students or those undergoing training, instruction or education. Towards this end, all forms of sexual harassment in the employment, education or training environment are hereby declared unlawful." Therefore the intent of the law is to prohibit and punish sexual harassment acts committed against students and employees regardless of their gender.',
    },
    {
        id: 'ra-9262',
        question:
            'Republic Act 9262 or Violence Against Women and Children, what is it about?',
        answer: 'Section 2 of RA 9262 states that "The State also recognizes the need to protect the family and its members particularly women and children, from violence and threats to their personal safety and security." Seeing as a significant number of the workforce under HEIs and CHED are women and a lot of students are minors, then their rights must be upheld and protected.',
    },
    {
        id: 'ra-9710',
        question:
            'Republic Act 9710 or Magna Carta of Women, what is it about?',
        answer: 'The Magna Carta of Women was enacted to prevent discrimination against women in workplaces, schools, and other institutions. This Republic Act effectively outlaws the expulsion of students for reason of pregnancy or removing the benefits of women in employment when in pregnancy. All other acts that discriminate and restrict the freedom and the rights of women as specified in this Republic Act are outlawed.',
    },
    {
        id: 'ra-11313',
        question: 'RA 11313 or Safe Spaces Act, what is it about?',
        answer: 'The Safe Spaces Act outlaws sexual harassments even those that are directed against transgenders or those of non-binary genders. Common sexual harassments like cat-calling or wolf whistling are also outlawed by this Republic Act. As stated in the Section 2 of Republic Act 11313 "It is the policy of the State to value the dignity of every human person and guarantee full respect for human rights. It is likewise the policy of the State to recognize the role of women in nation-building and ensure the fundamental equality before the law of women and men. The State also recognizes that both men and women must have equality, security and safety not only in private, but also on the streets, public spaces, online, workplaces and educational and training institutions".',
    },
];
