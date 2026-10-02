import {
    Bug,
    CircleHelp,
    Lightbulb,
    MessageSquareText,
    type LucideIcon,
} from 'lucide-react';
import { useId } from 'react';
import InputError from '@/components/input-error';
import type { FeedbackTypeOption } from '@/types/feedback';

/** Each feedback type's mark, by its code. */
export const feedbackTypeIcons: Record<string, LucideIcon> = {
    comment: MessageSquareText,
    question: CircleHelp,
    bug: Bug,
    feature: Lightbulb,
};

/**
 * The feedback type as four large tiles, two a row. Real radio buttons sit
 * inside, so arrow keys and screen readers treat them as one choice.
 */
export function TypeTiles({
    types,
    value,
    onChange,
    error,
}: {
    types: FeedbackTypeOption[];
    value: string;
    onChange: (value: string) => void;
    error?: string;
}) {
    const labelId = useId();
    const errorId = useId();

    return (
        <div className="survey-field-wide">
            <p id={labelId} className="survey-label">
                Feedback Type<span aria-hidden="true"> *</span>
            </p>
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                aria-required="true"
                aria-describedby={error ? errorId : undefined}
                className="feedback-types"
            >
                {types.map((type, index) => {
                    const Icon = feedbackTypeIcons[type.code];

                    return (
                        <label key={type.code} className="feedback-type">
                            <input
                                type="radio"
                                id={index === 0 ? 'type' : `type.${type.code}`}
                                name="type"
                                value={type.code}
                                checked={value === type.code}
                                onChange={() => onChange(type.code)}
                                aria-invalid={error ? true : undefined}
                            />
                            {Icon && <Icon aria-hidden="true" />}
                            <span>{type.label}</span>
                        </label>
                    );
                })}
            </div>
            <InputError id={errorId} message={error} />
        </div>
    );
}
