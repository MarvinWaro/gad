import type { Ref } from 'react';
import type { Questionnaire } from '@/components/survey/questionnaire';
import { errorTarget, stepOf } from '@/components/survey/validation';

/**
 * Everything to fix before the respondent can go on, each linking to its
 * control: the link opens the step that asks it, then moves focus there.
 */
export function ErrorSummary({
    ref,
    issues,
    message,
    questionnaire,
    onShowStep,
}: {
    ref: Ref<HTMLDivElement>;
    /** [answer key, message] pairs. */
    issues: [string, string][];
    /** Shown when there is nothing to list. */
    message: string;
    questionnaire: Questionnaire;
    onShowStep: (step: number) => void;
}) {
    if (!message && issues.length === 0) {
        return null;
    }

    return (
        <div
            ref={ref}
            className="survey-error-summary"
            role="alert"
            tabIndex={-1}
        >
            <strong>
                {issues.length > 0
                    ? `There ${issues.length === 1 ? 'is 1 thing' : `are ${issues.length} things`} to fix before you continue.`
                    : 'Please review the highlighted fields.'}
            </strong>
            {issues.length > 0 ? (
                <ul className="survey-error-list">
                    {issues.map(([id, text]) => (
                        <li key={id}>
                            <a
                                href={`#${errorTarget(id, questionnaire)}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    if (id !== 'version_id') {
                                        onShowStep(stepOf(id));
                                    }
                                    requestAnimationFrame(() => {
                                        const field = document.getElementById(
                                            errorTarget(id, questionnaire),
                                        );
                                        field?.scrollIntoView({
                                            block: 'center',
                                            behavior: 'smooth',
                                        });
                                        field?.focus();
                                    });
                                }}
                            >
                                {text}
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>{message || 'Your response has not been submitted.'}</p>
            )}
        </div>
    );
}
