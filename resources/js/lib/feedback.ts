import type { FeedbackAnswers, FeedbackQuestions } from '@/types/feedback';

/** The fields of the last step: who sent it and from where. */
const detailFields = ['email', 'name', 'region_id', 'hei_id', 'website'];

/**
 * The form's steps, as the old Google Form's pages: the feedback itself,
 * then one step per 1-to-5 scale, then the sender's optional details.
 */
export function feedbackSteps(questions: FeedbackQuestions): string[] {
    return [
        'Your feedback',
        ...questions.scales.map((scale) => scale.title),
        'Your details',
    ];
}

/** The step (from 1) that asks an answer, for jumping to an error. */
export function feedbackStepOf(
    key: string,
    questions: FeedbackQuestions,
): number {
    const scale = questions.scales.findIndex((item) =>
        item.items.some((question) => question.key === key),
    );

    if (scale !== -1) return scale + 2;

    return detailFields.includes(key) ? questions.scales.length + 2 : 1;
}

/** What the first step still needs: the two answers the form requires. */
export function firstStepIssues(
    data: Pick<FeedbackAnswers, 'type' | 'feedback'>,
): Record<string, string> {
    return {
        ...(data.type ? {} : { type: 'Choose a feedback type.' }),
        ...(data.feedback.trim() ? {} : { feedback: 'Tell us your feedback.' }),
    };
}

/** An empty form, with the signed-in visitor's place when known. */
export function emptyAnswers(
    questions: FeedbackQuestions,
    prefill: { region_id: string; hei_id: string },
): FeedbackAnswers {
    const scores = [
        ...questions.choices.map((question) => question.key),
        ...questions.scales.flatMap((scale) =>
            scale.items.map((item) => item.key),
        ),
    ];

    return {
        type: '',
        feedback: '',
        suggestions: '',
        ...Object.fromEntries(scores.map((key) => [key, ''])),
        email: '',
        name: '',
        region_id: prefill.region_id,
        hei_id: prefill.hei_id,
        website: '',
    };
}
