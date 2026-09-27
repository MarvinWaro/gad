import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * One part of the editor, as on a settings page: its title and purpose on the
 * left, the controls on the right (stacked on narrow screens). The left
 * column stays in view while a long section scrolls past it.
 */
export function FormSection({
    title,
    description,
    aside,
    className,
    railClassName,
    children,
}: {
    title: string;
    description: string;
    aside?: React.ReactNode;
    className?: string;
    /** Classes for the title column, e.g. to stop it sticking. */
    railClassName?: string;
    children: React.ReactNode;
}) {
    const headingId = useId();

    return (
        <section
            aria-labelledby={headingId}
            className={cn(
                'grid gap-x-10 gap-y-5 border-t py-8 lg:grid-cols-[15rem_minmax(0,1fr)]',
                className,
            )}
        >
            <div
                className={cn(
                    'lg:sticky lg:top-6 lg:self-start',
                    railClassName,
                )}
            >
                <h2 id={headingId} className="text-base font-semibold">
                    {title}
                </h2>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">
                    {description}
                </p>
                {aside}
            </div>
            <div className="min-w-0">{children}</div>
        </section>
    );
}
