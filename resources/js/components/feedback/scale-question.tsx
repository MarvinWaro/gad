import { type CSSProperties, useId } from 'react';
import InputError from '@/components/input-error';

/**
 * A rated question as faces with descriptive labels, or the answer's words
 * themselves. Faces still submit numeric scores. They are real radio
 * buttons, so arrow keys move along the row. Every rated question is
 * optional, so a chosen answer can be cleared.
 */
export function ScaleQuestion({
    id,
    label,
    optional = false,
    options,
    value,
    onChange,
    error,
}: {
    /** The first option's id, for the error summary's link. */
    id: string;
    label: string;
    /** Marks the question optional, where required ones sit beside it. */
    optional?: boolean;
    options: { value: number; label: string; emoji?: string }[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    const labelId = useId();
    const errorId = useId();
    const faces = options.some((option) => option.emoji !== undefined);
    const selected = options.find((option) => String(option.value) === value);

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
                data-faces={faces || undefined}
                style={{ '--options': options.length } as CSSProperties}
            >
                {options.map((option, index) => (
                    <label
                        key={option.value}
                        className="feedback-option"
                        title={option.emoji ? option.label : undefined}
                    >
                        <input
                            type="radio"
                            id={index === 0 ? id : `${id}.${option.value}`}
                            name={id}
                            value={option.value}
                            checked={value === String(option.value)}
                            onChange={() => onChange(String(option.value))}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? errorId : undefined}
                        />
                        {option.emoji ? (
                            <>
                                <span
                                    aria-hidden="true"
                                    className="feedback-face"
                                >
                                    {option.emoji}
                                </span>
                                <span className="sr-only">{option.label}</span>
                            </>
                        ) : (
                            <span>{option.label}</span>
                        )}
                    </label>
                ))}
            </div>
            {faces && (
                <>
                    <p className="feedback-scale-ends" aria-hidden="true">
                        <span>{options[0]?.label}</span>
                        <span>{options.at(-1)?.label}</span>
                    </p>
                    <p className="feedback-scale-selection" role="status">
                        {selected ? `Selected: ${selected.label}` : ''}
                    </p>
                </>
            )}
            <InputError id={errorId} message={error} />
        </div>
    );
}
