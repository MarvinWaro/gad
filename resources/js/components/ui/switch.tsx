import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/** An on/off switch: ink when on. Name it with `aria-labelledby` or `aria-label`. */
export function Switch({
    checked,
    onCheckedChange,
    className,
    ...props
}: Omit<ComponentProps<'button'>, 'onClick' | 'role'> & {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                checked ? 'bg-primary' : 'bg-input',
                className,
            )}
            {...props}
        >
            <span
                className={cn(
                    'size-5 rounded-full bg-background shadow-sm transition-transform',
                    checked ? 'translate-x-5' : 'translate-x-0',
                )}
            />
        </button>
    );
}
