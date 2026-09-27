import { eventCategories } from '@/lib/event-dates';
import { cn } from '@/lib/utils';
import type { EventCategory } from '@/types';

/** A category mark that never relies on color alone: dot plus label. */
export function EventCategoryLabel({
    category,
    className,
}: {
    category: EventCategory;
    className?: string;
}) {
    const meta = eventCategories[category] ?? eventCategories.other;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
                className,
            )}
        >
            <span
                aria-hidden
                className={cn('size-2 shrink-0 rounded-full', meta.dot)}
            />
            {meta.label}
        </span>
    );
}

export function EventCategoryDot({ category }: { category: EventCategory }) {
    const meta = eventCategories[category] ?? eventCategories.other;

    return (
        <span
            aria-hidden
            className={cn('size-1.5 shrink-0 rounded-full', meta.dot)}
        />
    );
}
