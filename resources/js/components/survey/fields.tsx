import { Check } from 'lucide-react';
import { cloneElement, isValidElement, type ReactElement, useId } from 'react';
import InputError from '@/components/input-error';
import type { Option } from '@/components/survey/types';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';

/** The public survey's form controls, styled by public.css. */

export function Field({
    label,
    error,
    note,
    wide,
    required = true,
    fieldId,
    children,
}: {
    label: string;
    error?: string;
    note?: React.ReactNode;
    wide?: boolean;
    required?: boolean;
    fieldId?: string;
    children: React.ReactNode;
}) {
    const generatedId = useId();
    // A stable id lets the error summary link straight to the control.
    const id = fieldId ?? generatedId;
    const noteId = note ? `${id}-note` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
        [noteId, errorId].filter(Boolean).join(' ') || undefined;
    const control = isValidElement(children)
        ? cloneElement(
              children as ReactElement<{
                  id?: string;
                  'aria-describedby'?: string;
                  'aria-required'?: boolean;
                  'aria-invalid'?: boolean;
              }>,
              {
                  id,
                  'aria-describedby': describedBy,
                  'aria-required': required,
                  'aria-invalid': error ? true : undefined,
              },
          )
        : children;

    return (
        <div className={wide ? 'survey-field-wide' : ''}>
            <label className="survey-label" htmlFor={id}>
                {label}
                {required ? (
                    <span aria-hidden="true"> *</span>
                ) : (
                    <>
                        {' '}
                        <span className="survey-label-optional">Optional</span>
                    </>
                )}
            </label>
            {control}
            {note && (
                <p id={noteId} className="survey-field-note">
                    {note}
                </p>
            )}
            <InputError id={errorId} message={error} />
        </div>
    );
}

/**
 * A choose-one question as radio buttons, for short lists that read best
 * with every choice in view (gender identity, scholar). The first option
 * carries the question's id so the error summary can move focus to it.
 */
export function RadioField({
    label,
    hint,
    fieldId,
    options,
    value,
    onChange,
    required = true,
    error,
    inline = false,
}: {
    label: string;
    hint?: string;
    fieldId: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    error?: string;
    inline?: boolean;
}) {
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
        <fieldset
            className="survey-radio-field"
            aria-describedby={
                [hintId, errorId].filter(Boolean).join(' ') || undefined
            }
        >
            <legend className="survey-label">
                {label}
                {required ? (
                    <span aria-hidden="true"> *</span>
                ) : (
                    <>
                        {' '}
                        <span className="survey-label-optional">Optional</span>
                    </>
                )}
            </legend>
            {hint && (
                <p id={hintId} className="survey-radio-hint">
                    {hint}
                </p>
            )}
            <div
                className={inline ? 'survey-radios is-inline' : 'survey-radios'}
            >
                {options.map((option, index) => {
                    const id =
                        index === 0 ? fieldId : `${fieldId}.${option.value}`;

                    return (
                        <label
                            key={option.value}
                            className="survey-radio"
                            htmlFor={id}
                        >
                            <input
                                type="radio"
                                id={id}
                                name={fieldId}
                                value={option.value}
                                checked={value === option.value}
                                onChange={() => onChange(option.value)}
                                aria-invalid={error ? true : undefined}
                            />
                            <span>{option.label}</span>
                        </label>
                    );
                })}
            </div>
            <InputError id={errorId} message={error} />
        </fieldset>
    );
}

export function PublicSelect({
    value,
    onChange,
    placeholder,
    options,
    disabled = false,
    id,
    'aria-describedby': describedBy,
    'aria-required': required,
    'aria-invalid': invalid,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: Option[];
    disabled?: boolean;
    id?: string;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
}) {
    return (
        <FormSelect
            id={id}
            aria-describedby={describedBy}
            aria-required={required}
            aria-invalid={invalid}
            className="survey-input"
            contentClassName="public-theme"
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            options={options}
            allowEmpty={!disabled}
        />
    );
}

/**
 * A check-all-that-apply option drawn as a pill. A real checkbox sits inside,
 * so the keyboard, screen readers and the error summary treat it as one.
 */
export function ChoiceChip({
    id: chipId,
    invalid,
    checked,
    onChange,
    label,
}: {
    id?: string;
    invalid?: boolean;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}) {
    const generatedId = useId();
    const id = chipId ?? generatedId;

    return (
        <label className="survey-chip" htmlFor={id}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                aria-invalid={invalid || undefined}
                onChange={(event) => onChange(event.target.checked)}
            />
            <Check aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

export function CheckField({
    id: fieldId,
    invalid,
    checked,
    onChange,
    label,
}: {
    id?: string;
    invalid?: boolean;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}) {
    const generatedId = useId();
    const id = fieldId ?? generatedId;

    return (
        <label className="survey-check" htmlFor={id}>
            <Checkbox
                id={id}
                aria-invalid={invalid || undefined}
                checked={checked}
                onCheckedChange={(value) => onChange(value === true)}
            />
            <span>{label}</span>
        </label>
    );
}

/** One answer on the review step. */
export function Review({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt>{label}</dt>
            <dd>{value || 'Not provided'}</dd>
        </div>
    );
}
