import { ArrowUpRight, Check, Link2 } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from '@/lib/toast';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import type { HeiSurvey } from '@/types';

const count = new Intl.NumberFormat('en-PH');

/** "1 response", "12 responses". */
export function responsesLabel(responses: number): string {
    return `${count.format(responses)} ${responses === 1 ? 'response' : 'responses'}`;
}

const actionClass =
    'inline-flex items-center gap-1 rounded-sm underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * The two things a focal person does with a law survey: open it, or copy its
 * link to share. The home page's panel and its left rail both use these.
 */
export function SurveyActions({
    survey,
    className,
}: {
    survey: HeiSurvey;
    className?: string;
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
        <div
            className={cn('flex flex-wrap gap-x-4 gap-y-2 text-sm', className)}
        >
            <a
                href={survey.url}
                target="_blank"
                rel="noreferrer"
                className={actionClass}
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
                className={actionClass}
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
    );
}

/**
 * The four law surveys on one plain card, divided by hairlines rather than
 * split into a grid of identical cards. Each shows what this HEI has
 * contributed, and how to open or share it. From 1280px the home page's
 * left rail lists them instead.
 */
export function SurveyPanel({ surveys }: { surveys: HeiSurvey[] }) {
    const titleId = useId();

    if (surveys.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby={titleId}
            className="overflow-hidden rounded-xl border bg-card"
        >
            <header className="px-5 pt-5 sm:px-6">
                <h2 id={titleId} className="text-lg font-medium">
                    Law surveys
                </h2>
                <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                    Share these with your students and employees. Answers are
                    anonymous. Each count is how many people chose your
                    institution when they answered.
                </p>
            </header>
            <ul className="mt-4 flex snap-x snap-mandatory divide-x overflow-x-auto sm:grid sm:grid-cols-2 sm:divide-x-0 sm:overflow-visible xl:grid-cols-4">
                {surveys.map((survey, index) => (
                    <li
                        key={survey.id}
                        className={cn(
                            // Relative, so screen-reader text stays inside the scroller.
                            'relative flex w-[78%] shrink-0 snap-start flex-col px-5 pt-4 pb-5 sm:w-auto sm:px-6',
                            // Hairlines between columns and rows, never around the edge.
                            index % 2 === 1 && 'sm:border-l',
                            index >= 2 && 'sm:border-t xl:border-t-0',
                            index >= 1 && 'xl:border-l',
                        )}
                    >
                        <p className="text-xl leading-tight tabular-nums">
                            {survey.code}
                        </p>
                        <p className="mt-1 line-clamp-3 min-h-[3.75em] text-sm leading-snug text-muted-foreground">
                            {survey.law_title}
                        </p>
                        {survey.is_open ? (
                            <>
                                <p className="mt-3 text-sm tabular-nums">
                                    {responsesLabel(survey.responses_from_hei)}{' '}
                                    from your HEI
                                </p>
                                <SurveyActions
                                    survey={survey}
                                    className="mt-auto pt-4"
                                />
                            </>
                        ) : (
                            <p className="mt-auto pt-4 text-sm text-muted-foreground">
                                Opening soon. You can share it once CHED
                                publishes it.
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
}
