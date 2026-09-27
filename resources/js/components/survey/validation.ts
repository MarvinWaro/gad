import type {
    Questionnaire,
    Respondent,
} from '@/components/survey/questionnaire';
import type { Issues, SurveyAnswers } from '@/components/survey/types';

/**
 * Which answers on the respondent step are wrong, keyed by the id of the
 * control at fault, so the summary can link straight to it and the field can
 * show the same sentence beneath itself.
 */
export function detailErrors(
    data: SurveyAnswers,
    questionnaire: Questionnaire,
    respondent: Respondent,
): Issues {
    const errors: Issues = {};
    const { ageMin, ageMax, isRequired } = respondent;
    const age = data.age;
    if (
        questionnaire.answeringFor &&
        isRequired('answering_for') &&
        !data.answering_for
    ) {
        errors.answering_for = 'Choose who you are answering for.';
    }

    if (isRequired('age') && !age) {
        errors.age = 'Enter your age.';
    } else if (
        age !== '' &&
        (!Number.isInteger(Number(age)) ||
            Number(age) < ageMin ||
            Number(age) > ageMax)
    ) {
        errors.age = `Enter an age between ${ageMin} and ${ageMax}.`;
    }
    if (isRequired('sex') && !data.sex) {
        errors.sex = 'Choose an option for sex.';
    }
    if (
        respondent.genderIdentities.length > 0 &&
        isRequired('sex') &&
        !data.gender_identity
    ) {
        errors.gender_identity = `Choose the gender identity that best describes ${respondent.whom}.`;
    }
    if (isRequired('respondent_group') && !data.respondent_group) {
        errors.respondent_group = 'Choose the group you belong to.';
    }
    if (respondent.groupRequiresText && !data.respondent_group_other.trim()) {
        errors.respondent_group_other = 'Tell us which group you belong to.';
    }
    for (const question of respondent.groupFollowUps) {
        const answer = data.group_answers[question.key];
        if (question.required && !answer) {
            errors[`group_answers.${question.key}`] =
                `Choose an answer for “${question.label}”.`;
        } else if (
            question.options.find((option) => option.value === answer)
                ?.requires_text &&
            !data.group_answer_details[question.key]?.trim()
        ) {
            errors[`group_answer_details.${question.key}`] =
                `Tell us your answer for “${question.label}”.`;
        }
    }
    if (isRequired('region') && !data.region_id) {
        errors.region_id = 'Choose your region.';
    } else if (data.cluster_id && !data.region_id) {
        errors.region_id = 'Choose the region this cluster belongs to.';
    }
    if (isRequired('cluster') && !data.cluster_id) {
        errors.cluster_id = 'Choose your cluster.';
    } else if (data.hei_id && !data.cluster_id) {
        errors.cluster_id = 'Choose the cluster this institution belongs to.';
    }
    if (isRequired('hei') && !data.hei_id) {
        errors.hei_id = 'Choose your institution.';
    }
    if (age !== '' && Number(age) < 18 && !data.guardian_consent) {
        errors.guardian_consent =
            'Confirm a parent or guardian agrees before continuing.';
    }

    return errors;
}

export function experienceErrors(
    data: SurveyAnswers,
    questionnaire: Questionnaire,
    respondent: Respondent,
): Issues {
    const errors: Issues = {};
    const { matrix, textPerpetrator } = questionnaire;
    const { isRequired } = respondent;
    for (const question of questionnaire.multiSelects) {
        if (
            isRequired(question.id) &&
            (data.selections[question.id] ?? []).length === 0
        ) {
            errors[`selections.${question.id}`] =
                `Choose at least one option for ${question.label.replace(/\s*\*$/, '')}.`;
        }
    }
    if (!matrix) return errors;
    if (isRequired(matrix.id) && data.experiences.length === 0) {
        errors.experiences = 'Choose an experience or select the none option.';
    }
    const selectedExperiences = (matrix.options ?? []).filter((item) =>
        data.experiences.includes(item.value),
    );
    for (const item of selectedExperiences) {
        if (!data.perpetrators[item.value]?.length) {
            errors[`perpetrators.${item.value}`] =
                `Choose at least one perpetrator for ${item.label}.`;
        } else if (
            textPerpetrator &&
            data.perpetrators[item.value]?.includes(textPerpetrator.value) &&
            !data.other_relative_details[item.value]?.trim()
        ) {
            errors[`other_relative_details.${item.value}`] =
                `Provide the requested details for ${item.label}.`;
        }
    }
    return errors;
}

/** The step (1 to 3) that asks the answer an error belongs to. */
export function stepOf(key: string): number {
    if (key === 'consent') return 1;

    return /^(experiences|perpetrators|other_relative_details|selections)/.test(
        key,
    )
        ? 3
        : 2;
}

/** The id of the control an error summary link moves focus to. */
export function errorTarget(key: string, questionnaire: Questionnaire): string {
    const { matrix, noneValue, multiSelects } = questionnaire;
    if (key === 'version_id') return 'survey-title';
    if (key === 'experiences' || key.startsWith('experiences.'))
        return `experiences.${matrix?.options?.[0]?.value ?? noneValue}`;
    if (key.startsWith('group_answers.')) {
        return `group-answer-${key.slice('group_answers.'.length)}`;
    }
    if (key.startsWith('group_answer_details.')) {
        return `group-answer-${key.slice('group_answer_details.'.length)}-specify`;
    }
    if (key.startsWith('selections.')) {
        // The question's first option, so the link lands on something focusable.
        const first = multiSelects.find(
            (question) => `selections.${question.id}` === key,
        )?.options?.[0]?.value;

        return first ? `${key}.${first}` : key;
    }
    if (key.startsWith('perpetrators.'))
        return `${key.split('.').slice(0, 2).join('.')}.${matrix?.perpetrator_options?.[0]?.value ?? ''}`;
    return key;
}
