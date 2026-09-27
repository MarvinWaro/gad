import type {
    Cluster,
    Directories,
    FollowUpQuestion,
    Hei,
    Option,
    PublishedSurvey,
    Question,
    RespondentDetails,
    Section,
    SurveyAnswers,
} from '@/components/survey/types';

/** The questions the form treats specially, found once by key and type. */
export type Questionnaire = {
    questions: Question[];
    answeringFor?: Question;
    age?: Question;
    sex?: Question;
    matrix?: Question;
    /** The section holding the matrix, which titles the experiences step. */
    matrixSection?: Section;
    noneValue: string;
    perpetratorOptions: Option[];
    /** The perpetrator that asks for details, e.g. Other relative. */
    textPerpetrator?: Option;
    respondentGroups: Option[];
    /**
     * Check-all-that-apply questions sit alongside the matrix on the
     * experiences step, so the questionnaire can ask where something happened.
     */
    multiSelects: Question[];
};

/** What the answers so far change about the rest of the form. */
export type Respondent = {
    /** Answering for a minor under the respondent's legal care. */
    forMinor: boolean;
    /** Who the answers describe: "you", or "the minor". */
    whom: string;
    ageMin: number;
    ageMax: number;
    /**
     * Follow-ups that apply to this respondent, as on CHED's forms: gender
     * identity once sex is Female or Male, and the chosen group's questions.
     */
    genderIdentities: Option[];
    groupFollowUps: FollowUpQuestion[];
    /** The chosen group asks the respondent to name it. */
    groupRequiresText: boolean;
    /** Narrowed to the region, then the cluster, chosen so far. */
    clusters: Cluster[];
    heis: Hei[];
    /**
     * One source of truth for "must this be answered", so the asterisk, the
     * step check, and the server rule can never disagree.
     */
    isRequired: (id: string) => boolean;
    /** A respondent detail's label, e.g. "Minor's age" when answering for one. */
    detailLabel: (label: string) => string;
};

export function readQuestionnaire(
    survey: PublishedSurvey,
    directories: Directories,
): Questionnaire {
    const questions = survey.definition.sections.flatMap(
        (section) => section.questions,
    );
    const group = questions.find((q) => q.id === 'respondent_group');
    const matrix = questions.find((q) => q.type === 'experience_matrix');

    return {
        questions,
        answeringFor: questions.find((q) => q.id === 'answering_for'),
        age: questions.find((q) => q.id === 'age'),
        sex: questions.find((q) => q.id === 'sex'),
        matrix,
        matrixSection: survey.definition.sections.find((section) =>
            section.questions.some((q) => q === matrix),
        ),
        noneValue: matrix?.none_option?.value ?? 'none',
        perpetratorOptions: matrix?.perpetrator_options ?? [],
        textPerpetrator: matrix?.perpetrator_options?.find(
            (option) => option.requires_text,
        ),
        // Directory-backed from now on; a version published before the
        // directory existed keeps the options baked into its own questionnaire.
        respondentGroups: directories.respondent_groups?.length
            ? directories.respondent_groups
            : (group?.options ?? []),
        multiSelects: questions.filter(
            (question) => question.type === 'multi_select',
        ),
    };
}

/**
 * The option a questionnaire pre-selects for a choose-one question, used for
 * laws that address one group — RA 9710 opens with Female already chosen. A
 * default naming an option that no longer exists is ignored rather than
 * submitting a value the server would reject.
 */
export function defaultAnswer(
    questionnaire: Questionnaire,
    id: string,
): string {
    const question = questionnaire.questions.find((item) => item.id === id);
    const value = question?.default;

    return typeof value === 'string' &&
        question?.options?.some((option) => option.value === value)
        ? value
        : '';
}

/**
 * A question whose answer the questionnaire fixes — RA 9710 covers women, so
 * its sex question is filled in and left uneditable. Only counts as locked
 * once the default resolves to a real choice, so a stale default never leaves
 * a respondent staring at a disabled empty control.
 */
export function isLocked(questionnaire: Questionnaire, id: string): boolean {
    const question = questionnaire.questions.find((item) => item.id === id);

    return question?.locked === true && defaultAnswer(questionnaire, id) !== '';
}

/** A blank response, with the answers the questionnaire sets filled in. */
export function initialAnswers(
    survey: PublishedSurvey,
    questionnaire: Questionnaire,
): SurveyAnswers {
    return {
        version_id: survey.version_id,
        answering_for: defaultAnswer(questionnaire, 'answering_for'),
        age: '',
        sex: defaultAnswer(questionnaire, 'sex'),
        respondent_group: defaultAnswer(questionnaire, 'respondent_group'),
        respondent_group_other: '',
        gender_identity: '',
        group_answers: {},
        group_answer_details: {},
        region_id: '',
        cluster_id: '',
        hei_id: '',
        experiences: [],
        selections: Object.fromEntries(
            questionnaire.multiSelects.map((question) => [
                question.id,
                [] as string[],
            ]),
        ),
        perpetrators: {},
        other_relative_details: {},
        consent: false,
        guardian_consent: false,
    };
}

export function describeRespondent(
    survey: PublishedSurvey,
    questionnaire: Questionnaire,
    data: SurveyAnswers,
    directories: Directories,
    respondentDetails: RespondentDetails,
): Respondent {
    const forMinor =
        Boolean(questionnaire.answeringFor) &&
        data.answering_for === 'minor-under-legal-care';
    const group = questionnaire.respondentGroups.find(
        (option) => option.value === data.respondent_group,
    );

    return {
        forMinor,
        whom: forMinor ? 'the minor' : 'you',
        ageMin: questionnaire.age?.min ?? 1,
        ageMax: forMinor
            ? Math.min(17, questionnaire.age?.max ?? 120)
            : (questionnaire.age?.max ?? 120),
        genderIdentities: respondentDetails.gender_identities[data.sex] ?? [],
        groupFollowUps: group?.follow_ups ?? [],
        groupRequiresText: Boolean(group?.requires_text),
        clusters: directories.clusters.filter(
            (item) => String(item.survey_region_id) === data.region_id,
        ),
        heis: directories.heis.filter(
            (item) => String(item.survey_cluster_id) === data.cluster_id,
        ),
        isRequired: (id) =>
            (id === 'age' && forMinor) ||
            (survey.required?.[id] ?? 'sometimes') === 'required',
        detailLabel: (label) =>
            forMinor ? `Minor's ${label.toLowerCase()}` : label,
    };
}
