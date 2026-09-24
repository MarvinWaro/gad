import { ArrowUpRight, Check, Link2 } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/lib/utils';
import type { HeiSurvey } from '@/types';

const count = new Intl.NumberFormat('en-PH');

/**
 * The four law surveys on one cream callout (DESIGN.md), divided by hairlines
 * rather than split into a grid of identical cards. Each shows what this HEI
 * has contributed and the two things a focal person does: open or share.
 */
export function SurveyPanel({ surveys }: { surveys: HeiSurvey[] }) {
    const titleId = useId();

    if (surveys.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby={titleId}
            className="overflow-hidden rounded-[10px] bg-signature-cream text-signature-cream-foreground"
        >
            <header className="px-5 pt-5 sm:px-6">
                <h2 id={titleId} className="text-lg font-medium">
                    Law surveys
                </h2>
                <p className="mt-1 max-w-prose text-sm opacity-80">
                    Share these with your students and employees. Answers are
                    anonymous; the count shows responses from your institution.
                </p>
            </header>
            <ul className="mt-4 flex snap-x snap-mandatory divide-x divide-signature-cream-foreground/15 overflow-x-auto sm:grid sm:grid-cols-2 sm:divide-x-0 sm:overflow-visible xl:grid-cols-4">
                {surveys.map((survey, index) => (
                    <SurveyItem key={survey.id} survey={survey} index={index} />
                ))}
            </ul>
        </section>
    );
}

function SurveyItem({ survey, index }: { survey: HeiSurvey; index: number }) {
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
                'relative flex w-[78%] shrink-0 snap-start flex-col px-5 pt-4 pb-5 sm:w-auto sm:px-6',
                // Hairlines between columns and rows, never around the edge.
                'sm:border-signature-cream-foreground/15',
                index % 2 === 1 && 'sm:border-l',
                index >= 2 && 'sm:border-t xl:border-t-0',
                index >= 1 && 'xl:border-l',
            )}
        >
            <p className="text-xl leading-tight tabular-nums">{survey.code}</p>
            <p className="mt-1 line-clamp-3 min-h-[3.75em] text-sm leading-snug opacity-80">
                {survey.law_title}
            </p>

            {survey.is_open ? (
                <>
                    <p className="mt-3 text-sm tabular-nums">
                        <span className="text-base">
                            {count.format(survey.responses_from_hei)}
                        </span>{' '}
                        {survey.responses_from_hei === 1
                            ? 'response'
                            : 'responses'}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-4 text-sm">
                        <a
                            href={survey.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-sm underline decoration-signature-cream-foreground/30 underline-offset-4 outline-none hover:decoration-signature-cream-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                            className="inline-flex items-center gap-1 rounded-sm underline decoration-signature-cream-foreground/30 underline-offset-4 outline-none hover:decoration-signature-cream-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
