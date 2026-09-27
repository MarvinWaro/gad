import type { LawRecord } from './phlgadis-demo';

export type GlossaryTerm = {
    slug: string;
    term: string;
    definition: string;
    // Lettered sub-items, stored without their "a)" markers.
    items?: string[];
    // Slug of the term this one is a form of (RA 9262 lists four acts of VAWC).
    partOf?: string;
};
export type GlossaryGroup = {
    law: LawRecord['slug'];
    section: string;
    terms: GlossaryTerm[];
};

// Text is as the old PHLGADIS system shows it. Each definition matches its
// Act's definition section: RA 9262 Sec. 3 (checked against LawPhil and
// ChanRobles), RA 9710 Sec. 4 and RA 11313 Sec. 3 (the PDFs in
// public/assets/document). Groups follow the site's law order; terms follow
// the order of the Act.
export const glossary: GlossaryGroup[] = [
    {
        law: 'ra-9262',
        section: 'Section 3',
        terms: [
            {
                slug: 'violence-against-women-and-their-children',
                term: 'Violence against women and their children',
                definition:
                    'refers to any act or a series of acts committed by any person against a woman who is his wife, former wife, or against a woman with whom the person has or had a sexual or dating relationship, or with whom he has a common child, or against her child whether legitimate or illegitimate, within or without the family abode, which result in or is likely to result in physical, sexual, psychological harm or suffering, or economic abuse including threats of such acts, battery, assault, coercion, harassment or arbitrary deprivation of liberty. It includes, but is not limited to, the following acts:',
            },
            {
                slug: 'physical-violence',
                term: 'Physical violence',
                definition:
                    'refers to acts that include bodily or physical harm;',
                partOf: 'violence-against-women-and-their-children',
            },
            {
                slug: 'sexual-violence',
                term: 'Sexual violence',
                definition:
                    'refers to an act which is sexual in nature, committed against a woman or her child. It includes, but is not limited to:',
                items: [
                    "rape, sexual harassment, acts of lasciviousness, treating a woman or her child as a sex object, making demeaning and sexually suggestive remarks, physically attacking the sexual parts of the victim's body, forcing her/him to watch obscene publications and indecent shows or forcing the woman or her child to do indecent acts and/or make films thereof, forcing the wife and mistress/lover to live in the conjugal home or sleep together in the same room with the abuser;",
                    'acts causing or attempting to cause the victim to engage in any sexual activity by force, threat of force, physical or other harm or threat of physical or other harm or coercion;',
                    'Prostituting the woman or child.',
                ],
                partOf: 'violence-against-women-and-their-children',
            },
            {
                slug: 'psychological-violence',
                term: 'Psychological violence',
                definition:
                    'refers to acts or omissions causing or likely to cause mental or emotional suffering of the victim such as but not limited to intimidation, harassment, stalking, damage to property, public ridicule or humiliation, repeated verbal abuse and mental infidelity. It includes causing or allowing the victim to witness the physical, sexual or psychological abuse of a member of the family to which the victim belongs, or to witness pornography in any form or to witness abusive injury to pets or to unlawful or unwanted deprivation of the right to custody and/or visitation of common children.',
                partOf: 'violence-against-women-and-their-children',
            },
            {
                slug: 'economic-abuse',
                term: 'Economic abuse',
                definition:
                    'refers to acts that make or attempt to make a woman financially dependent which includes, but is not limited to the following:',
                items: [
                    'withdrawal of financial support or preventing the victim from engaging in any legitimate profession, occupation, business or activity, except in cases wherein the other spouse/partner objects on valid, serious and moral grounds as defined in Article 73 of the Family Code;',
                    'deprivation or threat of deprivation of financial resources and the right to the use and enjoyment of the conjugal, community or property owned in common;',
                    'destroying household property;',
                    "controlling the victims' own money or properties or solely controlling the conjugal money or properties.",
                ],
                partOf: 'violence-against-women-and-their-children',
            },
            {
                slug: 'battery',
                term: 'Battery',
                definition:
                    'refers to an act of inflicting physical harm upon the woman or her child resulting to the physical and psychological or emotional distress.',
            },
            {
                slug: 'stalking',
                term: 'Stalking',
                definition:
                    'refers to an intentional act committed by a person who, knowingly and without lawful justification follows the woman or her child or places the woman or her child under surveillance directly or indirectly or a combination thereof.',
            },
            {
                slug: 'dating-relationship',
                term: 'Dating relationship',
                definition:
                    'refers to a situation wherein the parties live as husband and wife without the benefit of marriage or are romantically involved over time and on a continuing basis during the course of the relationship. A casual acquaintance or ordinary socialization between two individuals in a business or social context is not a dating relationship.',
            },
            {
                slug: 'sexual-relations',
                term: 'Sexual relations',
                definition:
                    'refers to a single sexual act which may or may not result in the bearing of a common child.',
            },
            {
                slug: 'safe-place-or-shelter',
                term: 'Safe place or shelter',
                definition:
                    'refers to any home or institution maintained or managed by the Department of Social Welfare and Development (DSWD) or by any other agency or voluntary organization accredited by the DSWD for the purposes of this Act or any other suitable place the resident of which is willing temporarily to receive the victim.',
            },
            {
                slug: 'children',
                term: 'Children',
                definition:
                    'refers to those below eighteen (18) years of age or older but are incapable of taking care of themselves as defined under Republic Act No. 7610. As used in this Act, it includes the biological children of the victim and other children under her care.',
            },
        ],
    },
    {
        law: 'ra-9710',
        section: 'Section 4',
        terms: [
            {
                slug: 'gender-equality',
                term: 'Gender Equality',
                definition:
                    'refers to the principle asserting the equality of men and women and their right to enjoy equal conditions realizing their full human potentials to contribute to and benefit from the results of development, and with the State recognizing that all human beings are free and equal in dignity and rights.',
            },
            {
                slug: 'gender-equity',
                term: 'Gender Equity',
                definition:
                    'refers to the policies, instruments, programs, services, and actions that address the disadvantaged position of women in society by providing preferential treatment and affirmative action. Such temporary special measures aimed at accelerating de facto equality between men and women shall not be considered discriminatory but shall in no way entail as a consequence the maintenance of unequal or separate standards. These measures shall be discontinued when the objectives of equality of opportunity and treatment have been achieved.',
            },
            {
                slug: 'gender-and-development',
                term: 'Gender and Development (GAD)',
                definition:
                    "refers to the development perspective and process that are participatory and empowering, equitable, sustainable, free from violence, respectful of human rights, supportive of self-determination and actualization of human potentials. It seeks to achieve gender equality as a fundamental value that should be reflected in development choices; seeks to transform society's social, economic, and political structures and questions the validity of the gender roles they ascribed to women and men; contends that women are active agents of development and not just passive recipients of development assistance; and stresses the need of women to organize themselves and participate in political processes to strengthen their legal rights.",
            },
            {
                slug: 'gender-mainstreaming',
                term: 'Gender Mainstreaming',
                definition:
                    "refers to the strategy for making women's as well as men's concerns and experiences an integral dimension of the design, implementation, monitoring, and evaluation of policies and programs in all political, economic, and societal spheres so that women and men benefit equally and inequality is not perpetuated. It is the process of assessing the implications for women and men of any planned action, including legislation, policies, or programs in all areas and at all levels.",
            },
        ],
    },
    {
        law: 'ra-11313',
        section: 'Section 3',
        terms: [
            {
                slug: 'catcalling',
                term: 'Catcalling',
                definition:
                    'refers to unwanted remarks directed towards a person, commonly done in the form of wolf-whistling and misogynistic, transphobic, homophobic, and sexist slurs.',
            },
            {
                slug: 'gender',
                term: 'Gender',
                definition:
                    'refers to a set of socially ascribed characteristics, norms, roles, attitudes, values and expectations identifying the social behavior of men and women, and the relations between them.',
            },
            {
                slug: 'gender-identity-and-expression',
                term: 'Gender identity and/or expression',
                definition:
                    'refers to the personal sense of identity as characterized, among others, by manner of clothing, inclinations, and behavior in relation to masculine or feminine conventions. A person may have a male or female identity with physiological characteristics of the opposite sex in which case this person is considered transgender.',
            },
            {
                slug: 'public-spaces',
                term: 'Public spaces',
                definition:
                    'refer to streets and alleys, public parks, schools, buildings, malls, bars, restaurants, transportation terminals, public markets, spaces used as evacuation centers, government offices, public utility vehicles as well as private vehicles covered by app-based transport network services and other recreational spaces such as, but not limited to, cinema halls, theaters and spas.',
            },
        ],
    },
];
