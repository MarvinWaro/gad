import { ArrowUpRight, Check, Link2 } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from '@/lib/toast';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import type { HeiSurvey } from '@/types';

const count = new Intl.NumberFormat('en-PH');

/**
 * The four law surveys on one soft callout surface (DESIGN.md), divided by hairlines
 * rather than split into a grid of identical cards. Each shows what this HEI
 * has contributed and the two things a focal person does: open or share.
 * `rail` stacks them in one column, for the home page's left rail.
 */
export function SurveyPanel({
    surveys,
    variant = 'panel',
}: {
    surveys: HeiSurvey[];
    variant?: 'panel' | 'rail';
}) {
    const titleId = useId();
    const rail = variant === 'rail';

    if (surveys.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby={titleId}
            className="overflow-hidden rounded-[10px] bg-callout bg-callout-gradient text-callout-foreground"
        >
            <header className={rail ? 'px-5 pt-5' : 'px-5 pt-5 sm:px-6'}>
                <h2 id={titleId} className="text-lg font-medium">
                    Law surveys
                </h2>
                <p className="mt-1 max-w-prose text-sm opacity-80">
                    Share these with your students and employees. Answers are
                    anonymous. Each count is how many people chose your
                    institution when they answered.
                </p>
            </header>
            <ul
                className={
                    rail
                        ? 'mt-3 divide-y divide-callout-foreground/15'
                        : 'mt-4 flex snap-x snap-mandatory divide-x divide-callout-foreground/15 overflow-x-auto sm:grid sm:grid-cols-2 sm:divide-x-0 sm:overflow-visible xl:grid-cols-4'
                }
            >
                {surveys.map((survey, index) => (
                    <SurveyItem
                        key={survey.id}
                        survey={survey}
                        index={index}
                        rail={rail}
                    />
                ))}
            </ul>
        </section>
    );
}

function SurveyItem({
    survey,
    index,
    rail,
}: {
    survey: HeiSurvey;
    index: number;
    rail: boolean;
}) {
    const [, copy] = useClipboard();
    const [copied, setCopied] = useState(false);

    async function share() {
        if (await copy(survey.url)) {
            setCopied(true);
            toast.success(`${survey.code} survey link copied.`);
            window.setTimeout(() => setCopied(false), 2000);
        } else {
            toast.error(
                'Could not copy the link. Copy it from the survey page instead.',
            );
        }
    }

    return (
        <li
            className={cn(
                // Relative, so screen-reader text stays inside the scroller.
                'relative flex flex-col',
                rail
                    ? 'px-5 pt-3.5 pb-4'
                    : [
                          'w-[78%] shrink-0 snap-start px-5 pt-4 pb-5 sm:w-auto sm:px-6',
                          // Hairlines between columns and rows, never around the edge.
                          'sm:border-callout-foreground/15',
                          index % 2 === 1 && 'sm:border-l',
                          index >= 2 && 'sm:border-t xl:border-t-0',
                          index >= 1 && 'xl:border-l',
                      ],
            )}
        >
            <p
                className={cn(
                    'leading-tight tabular-nums',
                    rail ? 'text-lg' : 'text-xl',
                )}
            >
                {survey.code}
            </p>
            <p
                className={cn(
                    'mt-1 text-sm leading-snug opacity-80',
                    rail ? 'line-clamp-2' : 'line-clamp-3 min-h-[3.75em]',
                )}
            >
                {survey.law_title}
            </p>

            {survey.is_open ? (
                <>
                    <p
                        className={cn(
                            'text-sm tabular-nums',
                            rail ? 'mt-2' : 'mt-3',
                        )}
                    >
                        <span className="text-base">
                            {count.format(survey.responses_from_hei)}
                        </span>{' '}
                        {survey.responses_from_hei === 1
                            ? 'response'
                            : 'responses'}{' '}
                        from your HEI
                    </p>
                    <div
                        className={cn(
                            'mt-auto flex flex-wrap gap-x-4 gap-y-2 text-sm',
                            rail ? 'pt-2.5' : 'pt-4',
                        )}
                    >
                        <a
                            href={survey.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-sm underline decoration-callout-foreground/30 underline-offset-4 outline-none hover:decoration-callout-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            Open survey
                            <ArrowUpRight aria-hidden className="size-3.5" />
                            <span className="sr-only">
                                {' '}
                                {survey.code} (opens in a new tab)
                            </span>
                        </a>
                        <button
                            type="button"
                            onClick={() => void share()}
                            className="inline-flex items-center gap-1 rounded-sm underline decoration-callout-foreground/30 underline-offset-4 outline-none hover:decoration-callout-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {copied ? (
                                <Check aria-hidden className="size-3.5" />
                            ) : (
                                <Link2 aria-hidden className="size-3.5" />
                            )}
                            {copied ? 'Copied' : 'Copy link'}
                            <span className="sr-only"> for {survey.code}</span>
                        </button>
                    </div>
                </>
            ) : (
                <p className="mt-auto pt-4 text-sm opacity-70">
                    Opening soon. You can share it once CHED publishes it.
                </p>
            )}
        </li>
    );
}
