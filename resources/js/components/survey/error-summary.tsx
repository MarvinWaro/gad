import type { Ref } from 'react';

/**
 * Everything to fix before the person can go on, each linking to its
 * control: the link opens the step that asks it, then moves focus there.
 * Shared by the law surveys and the website feedback form.
 */
export function ErrorSummary({
    ref,
    issues,
    message,
    targetOf,
    onShow,
    unsentMessage = 'Your response has not been submitted.',
}: {
    ref: Ref<HTMLDivElement>;
    /** [answer key, message] pairs. */
    issues: [string, string][];
    /** Shown when there is nothing to list. */
    message: string;
    /** The id of the control an answer key's link moves focus to. */
    targetOf: (key: string) => string;
    /** Opens the step that asks the answer. */
    onShow: (key: string) => void;
    /** The fallback when there is neither a list nor a message. */
    unsentMessage?: string;
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
                                href={`#${targetOf(id)}`}
                                onClick={(event) => {
                                    event.preventDefault();
                                    onShow(id);
                                    requestAnimationFrame(() => {
                                        const field = document.getElementById(
                                            targetOf(id),
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
                <p>{message || unsentMessage}</p>
            )}
        </div>
    );
}
