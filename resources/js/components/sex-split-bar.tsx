import { cn } from '@/lib/utils';

/**
 * Women's and men's shares of a whole as one bar: female (`series-1`) from
 * the start, male (`series-2`) to the end, as in the dashboard's Sex donut,
 * with a 2px gap between them. `parity` marks the halfway point. It is
 * decorative; the figures beside it carry the meaning.
 */
export function SexSplitBar({
    female,
    male,
    parity = false,
    className,
}: {
    female: number;
    male: number;
    parity?: boolean;
    className?: string;
}) {
    const total = female + male;

    return (
        <div
            aria-hidden="true"
            className={cn('relative flex h-2 gap-0.5', className)}
        >
            {total === 0 ? (
                <div className="h-full w-full rounded-[4px] bg-muted" />
            ) : (
                <>
                    {female > 0 && (
                        <div
                            className={cn(
                                'h-full rounded-l-[4px] bg-series-1',
                                male === 0 && 'rounded-r-[4px]',
                            )}
                            style={{ width: `${(female / total) * 100}%` }}
                        />
                    )}
                    {male > 0 && (
                        <div
                            className={cn(
                                'h-full min-w-0 flex-1 rounded-r-[4px] bg-series-2',
                                female === 0 && 'rounded-l-[4px]',
                            )}
                        />
                    )}
                </>
            )}
            {parity && (
                <span className="absolute -inset-y-1 left-1/2 w-px bg-foreground/60" />
            )}
        </div>
    );
}

/** The legend for SexSplitBar, so colour is never the only key. */
export function SexLegend({ className }: { className?: string }) {
    return (
        <p
            className={cn(
                'flex items-center gap-4 text-xs text-muted-foreground',
                className,
            )}
        >
            <span className="flex items-center gap-1.5">
                <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full bg-series-1"
                />
                Female
            </span>
            <span className="flex items-center gap-1.5">
                <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full bg-series-2"
                />
                Male
            </span>
        </p>
    );
}
