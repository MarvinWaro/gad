import { type CSSProperties, useId } from 'react';
import InputError from '@/components/input-error';

/**
 * A rated question as a row of buttons: the numbers 1 to 5 with the words for
 * each end under them, or the answer's words themselves. They are real radio
 * buttons, so arrow keys move along the row. Every rated question is
 * optional, so a chosen answer can be cleared.
 */
export function ScaleQuestion({
    id,
    label,
    optional = false,
    options,
    low,
    high,
    value,
    onChange,
    error,
}: {
    /** The first option's id, for the error summary's link. */
    id: string;
    label: string;
    /** Marks the question optional, where required ones sit beside it. */
    optional?: boolean;
    options: { value: number; label: string }[];
    /** The words at each end of a numbered scale. */
    low?: string;
    high?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    const labelId = useId();
    const errorId = useId();
    const numbered = low !== undefined && high !== undefined;
    const last = options.length - 1;

    return (
        <div className="feedback-question">
            <div className="feedback-question-head">
                <p id={labelId} className="survey-label">
                    {label}
                    {optional && (
                        <>
                            {' '}
                            <span className="survey-label-optional">
                                Optional
                            </span>
                        </>
                    )}
                </p>
                {value !== '' && (
                    <button
                        type="button"
                        className="feedback-clear"
                        onClick={() => {
                            onChange('');
                            // The button goes with the answer; keep the
                            // keyboard on the question.
                            document.getElementById(id)?.focus();
                        }}
                    >
                        Clear
                        <span className="sr-only"> the answer to {label}</span>
                    </button>
                )}
            </div>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                aria-describedby={error ? errorId : undefined}
                className="feedback-scale"
                data-numbered={numbered || undefined}
                style={{ '--options': options.length } as CSSProperties}
            >
                {options.map((option, index) => (
                    <label key={option.value} className="feedback-option">
                        <input
                            type="radio"
                            id={index === 0 ? id : `${id}.${option.value}`}
                            name={id}
                            value={option.value}
                            checked={value === String(option.value)}
                            onChange={() => onChange(String(option.value))}
                            aria-invalid={error ? true : undefined}
                        />
                        <span>{option.label}</span>
                        {/* The end words belong to the end numbers: "1
                            Strongly Disagree". */}
                        {numbered && (index === 0 || index === last) && (
                            <span className="sr-only">
                                {index === 0 ? low : high}
                            </span>
                        )}
                    </label>
                ))}
            </div>
            {numbered && (
                <p className="feedback-scale-ends" aria-hidden="true">
                    <span>{low}</span>
                    <span>{high}</span>
                </p>
            )}
            <InputError id={errorId} message={error} />
        </div>
    );
}
