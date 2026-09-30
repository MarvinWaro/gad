import { cloneElement, isValidElement, type ReactElement, useId } from 'react';
import InputError from '@/components/input-error';
import {
    readOnlyControlClass,
    useReadOnly,
} from '@/components/survey-builder/read-only';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** The builder's multi-line inputs; add a min-h-* for their height. */
export const textareaClass =
    'w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

type ControlProps = {
    id?: string;
    'aria-describedby'?: string;
    readOnly?: boolean;
    className?: string;
};

export function Field({
    label,
    hint,
    error,
    className,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    /** Caps the field's width, e.g. `max-w-xl` for a one-line answer. */
    className?: string;
    children: React.ReactNode;
}) {
    const id = useId();
    const readOnly = useReadOnly();
    const hintId = hint ? `${id}-hint` : undefined;
    const control = isValidElement<ControlProps>(children)
        ? cloneElement(children as ReactElement<ControlProps>, {
              id,
              'aria-describedby': hintId,
              ...(readOnly && {
                  readOnly: true,
                  className: cn(children.props.className, readOnlyControlClass),
              }),
          })
        : children;

    return (
        <div className={className}>
            <Label htmlFor={id}>{label}</Label>
            <div className="mt-1.5">{control}</div>
            {hint && (
                <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
            <InputError className="mt-1.5" message={error} />
        </div>
    );
}
