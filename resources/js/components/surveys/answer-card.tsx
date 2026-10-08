import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCount, percentOf } from '@/lib/dashboard';
import type { AnswerOption, AnswerQuestion } from '@/types/survey-insights';

/**
 * One question of a survey's Summary, like Google Forms' summary: each answer
 * with its count and share of the respondents in view, a bar, and how many
 * were female and male. An experience folds out who was responsible. "View
 * data" swaps the bars for a table of the same figures. A protected question
 * (gender identity, sexual orientation) leaves its small counts out.
 */
export function AnswerCard({
    question,
    respondents,
}: {
    question: AnswerQuestion;
    /** Responses in view: what the shares are of. */
    respondents: number;
}) {
    const id = useId();
    const [table, setTable] = useState(false);
    const split = question.options.some((option) => option.female !== null);

    return (
        <section
            aria-labelledby={`${id}-title`}
            className="min-w-0 rounded-xl border bg-card p-5 sm:p-6"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 id={`${id}-title`} className="text-base font-medium">
                        {question.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {question.kind === 'matrix'
                            ? 'Respondents could choose several; shares are of everyone who answered.'
                            : 'Shares are of everyone who answered.'}
                    </p>
                    {question.protected && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Small counts, and one more where needed, are not
                            shown, so no one can be identified.
                        </p>
                    )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-pressed={table}
                    onClick={() => setTable(!table)}
                >
                    {table ? 'Show bars' : 'View data'}
                </Button>
            </div>

            {table ? (
                <AnswerTable
                    question={question}
                    respondents={respondents}
                    split={split}
                />
            ) : (
                <ol className="mt-5 space-y-4">
                    {question.options.map((option) => (
                        <AnswerRow
                            key={option.value}
                            option={option}
                            respondents={respondents}
                        />
                    ))}
                </ol>
            )}
        </section>
    );
}

function AnswerRow({
    option,
    respondents,
}: {
    option: AnswerOption;
    respondents: number;
}) {
    const share =
        option.count === null ? null : percentOf(option.count, respondents);

    return (
        <li>
            <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0">{option.label}</span>
                {share === null ? (
                    <span className="shrink-0 text-muted-foreground">
                        Not shown
                    </span>
                ) : (
                    <span className="shrink-0 tabular-nums">
                        <span className="font-medium">
                            {formatCount(option.count ?? 0)}
                        </span>{' '}
                        <span className="text-muted-foreground">
                            · {share}%
                        </span>
                    </span>
                )}
            </div>
            <div
                aria-hidden="true"
                className="mt-1.5 h-2 overflow-hidden rounded-r-[4px] bg-muted"
            >
                <div
                    className="h-full rounded-r-[4px] bg-chart-bar"
                    style={{ width: `${share ?? 0}%` }}
                />
            </div>
            {option.female !== null && (option.count ?? 0) > 0 && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    {formatCount(option.female)} female ·{' '}
                    {formatCount(option.male ?? 0)} male
                </p>
            )}
            {option.details.length > 0 && (
                <details className="group mt-2">
                    <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-1 rounded-sm text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                        <ChevronDown
                            aria-hidden="true"
                            className="size-3.5 transition-transform group-open:rotate-180"
                        />
                        Who was responsible
                    </summary>
                    <ul className="mt-2 space-y-2 border-l pl-3">
                        {option.details.map((detail) => (
                            <li key={detail.value}>
                                <div className="flex items-baseline justify-between gap-3 text-xs">
                                    <span className="min-w-0">
                                        {detail.label}
                                    </span>
                                    <span className="shrink-0 font-medium tabular-nums">
                                        {formatCount(detail.count)}
                                    </span>
                                </div>
                                <div
                                    aria-hidden="true"
                                    className="mt-1 h-1.5 overflow-hidden rounded-r-[4px] bg-muted"
                                >
                                    <div
                                        className="h-full rounded-r-[4px] bg-chart-bar"
                                        style={{
                                            width: `${percentOf(detail.count, option.count ?? 0)}%`,
                                        }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </li>
    );
}

function AnswerTable({
    question,
    respondents,
    split,
}: {
    question: AnswerQuestion;
    respondents: number;
    split: boolean;
}) {
    return (
        <div
            tabIndex={0}
            role="region"
            aria-label={`${question.label}, as a table`}
            className="mt-5 overflow-x-auto rounded-lg border outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <table className="w-full min-w-[28rem] text-left text-sm tabular-nums">
                <caption className="sr-only">{question.label}</caption>
                <thead className="bg-muted text-xs text-muted-foreground">
                    <tr>
                        <th scope="col" className="px-4 py-2 font-medium">
                            Answer
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-2 text-right font-medium"
                        >
                            Responses
                        </th>
                        <th
                            scope="col"
                            className="px-4 py-2 text-right font-medium"
                        >
                            Share
                        </th>
                        {split && (
                            <>
                                <th
                                    scope="col"
                                    className="px-4 py-2 text-right font-medium"
                                >
                                    Female
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-2 text-right font-medium"
                                >
                                    Male
                                </th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {question.options.map((option) => (
                        <tr key={option.value} className="border-t">
                            <th scope="row" className="px-4 py-2 font-normal">
                                {option.label}
                            </th>
                            <td className="px-4 py-2 text-right">
                                {option.count === null
                                    ? 'Not shown'
                                    : formatCount(option.count)}
                            </td>
                            <td className="px-4 py-2 text-right">
                                {option.count === null
                                    ? '—'
                                    : `${percentOf(option.count, respondents)}%`}
                            </td>
                            {split && (
                                <>
                                    <td className="px-4 py-2 text-right">
                                        {formatCount(option.female ?? 0)}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        {formatCount(option.male ?? 0)}
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
