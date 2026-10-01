import type { ComponentProps, ReactNode } from 'react';
import {
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';

/**
 * A dialog body that shows photos on the dark overlay with no card around
 * them, the close button on a small round plate. Shared by the post photo
 * viewer and the profile photo.
 */
export function PhotoLightboxContent({
    title,
    description,
    children,
    ...props
}: Omit<ComponentProps<typeof DialogContent>, 'className' | 'title'> & {
    /** Read by screen readers only. */
    title: string;
    /** Read by screen readers only. */
    description: string;
    children: ReactNode;
}) {
    return (
        <DialogContent
            {...props}
            className="max-w-[min(96vw,72rem)] gap-0 border-none bg-transparent p-0 shadow-none sm:max-w-[min(96vw,72rem)] [&>button:last-child]:top-2 [&>button:last-child]:right-2 [&>button:last-child]:rounded-full [&>button:last-child]:bg-background [&>button:last-child]:p-1.5 [&>button:last-child]:opacity-100"
        >
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <DialogDescription className="sr-only">
                {description}
            </DialogDescription>
            {children}
        </DialogContent>
    );
}
