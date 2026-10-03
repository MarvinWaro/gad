import { cn } from '@/lib/utils';

/**
 * A row of pressed-or-not buttons on a `muted` track, choosing what a chart
 * shows: Participation over time's metric, or enrollment or graduates.
 */
export function SegmentedSwitch<T extends string>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            className="inline-flex rounded-lg bg-muted p-1"
        >
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={cn(
                        'min-h-9 rounded-md px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        value === option.value
                            ? 'bg-card font-medium text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}
