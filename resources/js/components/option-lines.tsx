import { useEffect, useRef, useState } from 'react';
import { type SurveyOption, toLines } from '@/lib/survey-options';

/**
 * A one-choice-per-line textarea. It keeps the in-progress text (including a
 * trailing new line) while focused, and hands every edit to `onChange` so the
 * caller can turn it back into options with `fromLines`, which keeps the
 * stored values of renamed lines.
 */
export function OptionLines({
    options,
    onChange,
    ...props
}: {
    options?: SurveyOption[];
    onChange: (value: string) => void;
} & Omit<
    React.ComponentProps<'textarea'>,
    'value' | 'defaultValue' | 'onChange'
>) {
    const [text, setText] = useState(() => toLines(options));
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) {
            setText(toLines(options));
        }
    }, [options]);

    return (
        <textarea
            {...props}
            value={text}
            onFocus={() => {
                focused.current = true;
            }}
            onBlur={() => {
                focused.current = false;
                setText(toLines(options));
            }}
            onChange={(event) => {
                const value = event.target.value;
                setText(value);
                onChange(value);
            }}
        />
    );
}
