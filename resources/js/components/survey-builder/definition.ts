import type {
    Definition,
    Question,
    Section,
} from '@/components/survey-builder/types';

export const questionTypes = [
    { value: 'integer', label: 'Number', hint: 'A whole number, such as age.' },
    {
        value: 'single_select',
        label: 'Choose one',
        hint: 'One answer from a list you write.',
    },
    {
        value: 'multi_select',
        label: 'Choose many',
        hint: 'Any number of answers from a list you write.',
    },
    {
        value: 'directory_region',
        label: 'Region',
        hint: 'Pulled from the Region directory.',
    },
    {
        value: 'directory_hei',
        label: 'HEI',
        hint: 'Narrows to the region the respondent picked.',
    },
    {
        value: 'experience_matrix',
        label: 'Experience matrix',
        hint: 'Experiences, each revealing its own perpetrator list.',
    },
];

/**
 * The questions an editor sees. The definitions still carry a Cluster
 * question, but respondents are never asked it (the institution they pick
 * decides it), so the builder keeps it out of sight and leaves it as it is.
 * Returns each shown question's index in the section.
 */
export const shownQuestionIndexes = (section: Section): number[] =>
    section.questions.flatMap((question, index) =>
        question.type === 'directory_cluster' ? [] : [index],
    );

export const typeLabel = (type: string): string =>
    questionTypes.find((entry) => entry.value === type)?.label ??
    type.replaceAll('_', ' ');

let idCounter = 0;
const uniqueId = (prefix: string): string => {
    idCounter += 1;
    return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
};

/** Move an item within its list, ignoring moves past either end. */
export const moveWithin = <T>(list: T[], from: number, to: number): void => {
    if (to < 0 || to >= list.length) {
        return;
    }
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
};

export const countLabel = (count: number, noun: string): string =>
    `${count} ${noun}${count === 1 ? '' : 's'}`;

export const formatWhen = (iso: string | null): string | null => {
    if (!iso) {
        return null;
    }
    const date = new Date(iso);

    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          });
};

export function newSection(): Section {
    return { id: uniqueId('section'), title: 'New section', questions: [] };
}

/** A question of the given type, with the choices it needs to be valid. */
export function newQuestion(type: string): Question {
    return {
        id: uniqueId('question'),
        clientKey: uniqueId('key'),
        type,
        label: 'New question',
        required: true,
        ...(type === 'single_select'
            ? { options: [{ value: 'option-1', label: 'Option 1' }] }
            : {}),
        ...(type === 'integer' ? { min: 1, max: 120 } : {}),
        ...(type === 'experience_matrix'
            ? {
                  options: [{ value: 'experience-1', label: 'Experience 1' }],
                  none_option: {
                      value: 'none',
                      label: 'I have not experienced any of the above',
                  },
                  perpetrator_options: [
                      { value: 'option-1', label: 'Option 1' },
                  ],
              }
            : {}),
    };
}

/**
 * Give each question a React key of its own. Its answer key (`id`) cannot
 * serve: it is edited in place, and a key that changed with every keystroke
 * would remount the question and throw the cursor out of the field.
 */
export function withClientKeys(definition: Definition): Definition {
    return {
        ...definition,
        sections: definition.sections.map((section) => ({
            ...section,
            questions: section.questions.map((question, index) => ({
                ...question,
                clientKey: `${section.id}-${index}`,
            })),
        })),
    };
}

/** The definition as it is saved, without the builder's keys. */
export function withoutClientKeys(definition: Definition): Definition {
    return {
        ...definition,
        sections: definition.sections.map((section) => ({
            ...section,
            questions: section.questions.map((question) => {
                const { clientKey: _clientKey, ...saved } = question;

                return saved;
            }),
        })),
    };
}
