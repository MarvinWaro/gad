import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonitoringStage } from '@/types/monitoring';

const steps = ['Fill out', 'Print and sign', 'Upload and submit'];

/** The HEI's three steps, from filling in the form to sending the signed copy. */
export function ReportSteps({
    stage,
    uploading = false,
}: {
    stage: MonitoringStage;
    /** A signed copy is chosen, so the third step is under way. */
    uploading?: boolean;
}) {
    const current =
        stage === 'submitted' || stage === 'reviewed'
            ? steps.length
            : stage === 'ready'
              ? uploading
                  ? 2
                  : 1
              : 0;
    const done = stage === 'submitted' || stage === 'reviewed';

    return (
        <nav aria-label="Report progress">
            <ol className="grid grid-cols-3 gap-2 sm:gap-4">
                {steps.map((label, index) => {
                    const complete = done || index < current;
                    const active = !done && index === current;

                    return (
                        <li
                            key={label}
                            aria-current={active ? 'step' : undefined}
                            className={cn(
                                'flex min-w-0 flex-col gap-2 border-t-2 pt-3 sm:flex-row sm:items-center',
                                complete
                                    ? 'border-foreground'
                                    : active
                                      ? 'border-brand'
                                      : 'border-border',
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    'grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums',
                                    complete
                                        ? 'bg-foreground text-background'
                                        : active
                                          ? 'bg-brand text-brand-foreground'
                                          : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {complete ? (
                                    <Check className="size-3.5" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span
                                className={cn(
                                    'text-xs leading-snug sm:text-sm',
                                    active
                                        ? 'font-medium'
                                        : 'text-muted-foreground',
                                )}
                            >
                                <span className="sr-only">
                                    {complete
                                        ? 'Done: '
                                        : active
                                          ? 'Now: '
                                          : ''}
                                </span>
                                {label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
