import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * An icon-only button whose meaning is available on hover and focus, and to
 * assistive technology. `label` is the accessible name as well as the tooltip,
 * so the two can never drift apart. It is an action, not a submit button, so
 * using it inside a form never sends the form.
 */
export function IconAction({
    label,
    side = 'top',
    children,
    ...props
}: ComponentProps<typeof Button> & {
    label: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    children: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={label}
                    {...props}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>{label}</TooltipContent>
        </Tooltip>
    );
}
