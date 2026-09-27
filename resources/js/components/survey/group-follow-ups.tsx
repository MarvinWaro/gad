import { Field, PublicSelect, RadioField } from '@/components/survey/fields';
import type { FollowUpQuestion } from '@/components/survey/types';

/**
 * The chosen group's follow-up questions (e.g. Civilian → Occupation) on the
 * follow-up tint under the group. A choice that asks to specify, like
 * "Others", opens a text box under its question.
 */
export function GroupFollowUps({
    questions,
    answers,
    details,
    onAnswer,
    onDetail,
    errorFor,
    forMinor,
}: {
    questions: FollowUpQuestion[];
    answers: Record<string, string>;
    details: Record<string, string>;
    onAnswer: (key: string, value: string) => void;
    onDetail: (key: string, text: string) => void;
    errorFor: (key: string) => string | undefined;
    forMinor: boolean;
}) {
    return (
        <div className="survey-field-wide survey-conditional">
            {forMinor && (
                <p className="survey-radio-hint">
                    Answer these about the minor.
                </p>
            )}
            <div className="survey-field-grid">
                {questions.map((question) => {
                    const id = `group-answer-${question.key}`;
                    const value = answers[question.key] ?? '';
                    const chosen = question.options.find(
                        (option) => option.value === value,
                    );
                    const error = errorFor(`group_answers.${question.key}`);

                    return (
                        <div
                            key={question.key}
                            className="survey-follow-up-question"
                        >
                            {question.type === 'radio' ? (
                                <RadioField
                                    label={question.label}
                                    fieldId={id}
                                    options={question.options}
                                    value={value}
                                    onChange={(next) =>
                                        onAnswer(question.key, next)
                                    }
                                    required={question.required}
                                    error={error}
                                    // Short lists like Yes/No read best on one line.
                                    inline={
                                        question.options.length <= 4 &&
                                        question.options.every(
                                            (option) =>
                                                option.label.length <= 16,
                                        )
                                    }
                                />
                            ) : (
                                <Field
                                    label={question.label}
                                    fieldId={id}
                                    required={question.required}
                                    error={error}
                                >
                                    <PublicSelect
                                        value={value}
                                        onChange={(next) =>
                                            onAnswer(question.key, next)
                                        }
                                        placeholder="Select an answer"
                                        options={question.options}
                                    />
                                </Field>
                            )}
                            {chosen?.requires_text && (
                                <Field
                                    label="Please specify"
                                    fieldId={`${id}-specify`}
                                    error={errorFor(
                                        `group_answer_details.${question.key}`,
                                    )}
                                >
                                    <input
                                        className="survey-input"
                                        value={details[question.key] ?? ''}
                                        onChange={(event) =>
                                            onDetail(
                                                question.key,
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
