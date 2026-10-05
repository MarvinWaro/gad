import { cn } from '@/lib/utils';

/**
 * Marks a feature as a first version while it is tried out, such as GAD
 * Quest: a small brand-tinted label beside its name, wherever it appears.
 */
export function BetaTag({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-[6px] bg-brand-soft px-1.5 py-0.5 text-xs leading-none font-medium text-brand',
                className,
            )}
        >
            Beta
        </span>
    );
}
