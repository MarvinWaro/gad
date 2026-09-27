import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';

/** Spread into the Inertia visit so the popover can show progress and close. */
export type ConfirmVisit = { onStart: () => void; onFinish: () => void };

/**
 * A small confirmation anchored to the button that asked for it, for deletes
 * and deactivations. It stays open with a spinner while the request runs and
 * closes when it ends; a refusal arrives as the server's red toast.
 *
 * Usually the child button opens it. When something else opens it, such as
 * a menu item, pass `open`/`onOpenChange` and `anchorOnly`, so it points at
 * the child without taking over its click.
 */
export function ConfirmPopover({
    title,
    description,
    confirmLabel,
    confirmDisabled = false,
    onConfirm,
    open: controlledOpen,
    onOpenChange,
    anchorOnly = false,
    children,
}: {
    title: string;
    description?: ReactNode;
    confirmLabel: string;
    /** The action is not allowed right now; the description says why. */
    confirmDisabled?: boolean;
    onConfirm: (visit: ConfirmVisit) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    anchorOnly?: boolean;
    /** The button it opens from, or points at. */
    children: ReactElement;
}) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const titleId = useId();
    const descriptionId = useId();
    const open = controlledOpen ?? uncontrolledOpen;

    function setOpen(next: boolean) {
        setUncontrolledOpen(next);
        onOpenChange?.(next);
    }

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                // Stay put while the request runs, so the spinner is seen.
                if (!processing) {
                    setOpen(next);
                }
            }}
        >
            {anchorOnly ? (
                <PopoverAnchor asChild>{children}</PopoverAnchor>
            ) : (
                <PopoverTrigger asChild>{children}</PopoverTrigger>
            )}
            <PopoverContent
                role="alertdialog"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                align="end"
                className="w-80 rounded-[10px] p-4"
            >
                <p
                    id={titleId}
                    className="text-sm leading-snug font-medium text-pretty"
                >
                    {title}
                </p>
                {description && (
                    <p
                        id={descriptionId}
                        className="mt-1.5 text-[0.8125rem] leading-relaxed text-pretty text-muted-foreground"
                    >
                        {description}
                    </p>
                )}
                <div className="mt-4 flex justify-end gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={processing}
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        disabled={processing || confirmDisabled}
                        onClick={() =>
                            onConfirm({
                                onStart: () => setProcessing(true),
                                onFinish: () => {
                                    setProcessing(false);
                                    setOpen(false);
                                },
                            })
                        }
                    >
                        {processing && <Spinner />}
                        {confirmLabel}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
