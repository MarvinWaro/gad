import type { ReactNode } from 'react';
import { feedbackTypeIcons } from '@/components/feedback/type-tiles';
import { StatTile } from '@/components/stat-tile';
import { cn } from '@/lib/utils';
import type { FeedbackQuestions, FeedbackSummary } from '@/types/feedback';

const SCALE_MAX = 5;

/**
 * A labelled bar row: the label and its figure on one line, the bar under
 * them, so long labels such as "Comments/Recommendations" are never cut.
 */
const barRow =
    'grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-2 py-1.5 text-left text-sm';

/** "1 answer", "12 answers". */
function answers(count: number): string {
    return `${count.toLocaleString()} ${count === 1 ? 'answer' : 'answers'}`;
}

function percent(part: number, whole: number): string {
    return `${whole > 0 ? Math.round((part / whole) * 100) : 0}%`;
}

/**
 * The figures above the feedback list: totals, the types (each row narrows
 * the list to it), and how the rated questions were answered. Every figure
 * is printed; the bars only repeat it.
 */
export function FeedbackSummaryPanel({
    summary,
    questions,
    activeType,
    onType,
}: {
    summary: FeedbackSummary;
    questions: FeedbackQuestions;
    activeType: string;
    onType: (code: string) => void;
}) {
    const typeTotal = summary.types.reduce((sum, type) => sum + type.count, 0);

    return (
        <>
            <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                    label="Feedback received"
                    value={summary.total.toLocaleString()}
                    note={activeType ? 'of the chosen type' : 'in view'}
                />
                {questions.scales.map((scale) => {
                    const average = summary.scales[scale.key] ?? null;

                    return (
                        <StatTile
                            key={scale.key}
                            label={`Average ${scale.title.toLowerCase()}`}
                            value={average?.toFixed(1) ?? '—'}
                            note={
                                average === null
                                    ? 'No answers yet'
                                    : `out of ${SCALE_MAX} (${scale.high})`
                            }
                        />
                    );
                })}
                <StatTile
                    label="Left contact details"
                    value={summary.with_contact.toLocaleString()}
                    note={
                        summary.total > 0
                            ? `${percent(summary.with_contact, summary.total)} gave a name or email`
                            : 'Name and email are optional'
                    }
                />
            </dl>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card
                    title="Feedback type"
                    note="Choose a row to list only that type."
                >
                    <ul className="space-y-1">
                        {summary.types.map((type) => {
                            const pressed = activeType === type.code;
                            const Icon = feedbackTypeIcons[type.code];

                            return (
                                <li key={type.code}>
                                    <button
                                        type="button"
                                        aria-pressed={pressed}
                                        onClick={() =>
                                            onType(pressed ? '' : type.code)
                                        }
                                        className={cn(
                                            barRow,
                                            'rounded-md transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                            pressed && 'bg-muted',
                                        )}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            {Icon && (
                                                <Icon
                                                    aria-hidden="true"
                                                    className="size-4 shrink-0 text-muted-foreground"
                                                />
                                            )}
                                            <span className="truncate">
                                                {type.label}
                                            </span>
                                        </span>
                                        <Bar
                                            share={
                                                typeTotal > 0
                                                    ? type.count / typeTotal
                                                    : 0
                                            }
                                        />
                                        <Figure>
                                            {type.count.toLocaleString()} ·{' '}
                                            {percent(type.count, typeTotal)}
                                        </Figure>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </Card>

                <Card
                    title="Reading and layout"
                    note="How the screens read, by number of answers."
                >
                    <div className="space-y-5">
                        {questions.choices.map((question) => {
                            const score = summary.scores[question.key];
                            const total = score?.answers ?? 0;

                            return (
                                <div key={question.key}>
                                    <p className="px-2 text-sm font-medium">
                                        {question.label}
                                    </p>
                                    <p className="mb-1 px-2 text-xs text-muted-foreground">
                                        {answers(total)}
                                    </p>
                                    <ul>
                                        {question.options.map(
                                            (option, index) => {
                                                const count =
                                                    score?.counts[index] ?? 0;

                                                return (
                                                    <li
                                                        key={option.value}
                                                        className={barRow}
                                                    >
                                                        <span className="truncate">
                                                            {option.label}
                                                        </span>
                                                        <Bar
                                                            share={
                                                                total > 0
                                                                    ? count /
                                                                      total
                                                                    : 0
                                                            }
                                                        />
                                                        <Figure>
                                                            {count.toLocaleString()}{' '}
                                                            ·{' '}
                                                            {percent(
                                                                count,
                                                                total,
                                                            )}
                                                        </Figure>
                                                    </li>
                                                );
                                            },
                                        )}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {questions.scales.map((scale) => (
                    <Card
                        key={scale.key}
                        title={scale.title}
                        note={`Average out of ${SCALE_MAX}, from 1 (${scale.low}) to ${SCALE_MAX} (${scale.high}).`}
                    >
                        <ul className="space-y-1">
                            {scale.items.map((item) => {
                                const score = summary.scores[item.key];
                                const average = score?.average ?? null;

                                return (
                                    <li key={item.key} className={barRow}>
                                        <span>{item.label}</span>
                                        <Figure>
                                            {average === null ? (
                                                'No answers'
                                            ) : (
                                                <>
                                                    <span className="font-medium text-foreground">
                                                        {average.toFixed(1)}
                                                    </span>{' '}
                                                    ·{' '}
                                                    {answers(
                                                        score?.answers ?? 0,
                                                    )}
                                                </>
                                            )}
                                        </Figure>
                                        <Bar
                                            share={(average ?? 0) / SCALE_MAX}
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                        <AnswerCounts
                            items={scale.items}
                            summary={summary}
                            low={scale.low}
                            high={scale.high}
                        />
                    </Card>
                ))}
            </div>
        </>
    );
}

function Card({
    title,
    note,
    children,
}: {
    title: string;
    note: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-xl border bg-card px-3 py-4 sm:px-4">
            <h2 className="px-2 text-sm font-medium">{title}</h2>
            <p className="mb-3 px-2 text-xs text-muted-foreground">{note}</p>
            {children}
        </section>
    );
}

/**
 * A single-hue bar on a muted track, square at the start and rounded at its
 * tip, on its own line under the label and figure.
 */
function Bar({ share }: { share: number }) {
    return (
        <span
            className="order-last col-span-2 h-2.5 overflow-hidden rounded-r-[4px] bg-muted"
            aria-hidden="true"
        >
            <span
                className="block h-full rounded-r-[4px] bg-chart-bar"
                style={{ width: `${Math.min(1, share) * 100}%` }}
            />
        </span>
    );
}

function Figure({ children }: { children: ReactNode }) {
    return (
        <span className="text-right text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {children}
        </span>
    );
}

/** Every answer count behind a scale's averages, for reading exactly. */
function AnswerCounts({
    items,
    summary,
    low,
    high,
}: {
    items: { key: string; label: string }[];
    summary: FeedbackSummary;
    low: string;
    high: string;
}) {
    return (
        <details className="mx-2 mt-4 border-t pt-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                View answer counts
            </summary>
            <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[30rem] text-left text-xs tabular-nums">
                    <caption className="sr-only">
                        How many gave each answer, from 1 ({low}) to {SCALE_MAX}{' '}
                        ({high})
                    </caption>
                    <thead className="text-muted-foreground">
                        <tr className="border-b">
                            <th scope="col" className="py-2 pr-3 font-medium">
                                Question
                            </th>
                            {[1, 2, 3, 4, 5].map((value) => (
                                <th
                                    key={value}
                                    scope="col"
                                    className="px-2 py-2 text-right font-medium"
                                >
                                    {value}
                                </th>
                            ))}
                            <th
                                scope="col"
                                className="py-2 pl-2 text-right font-medium"
                            >
                                Average
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {items.map((item) => {
                            const score = summary.scores[item.key];

                            return (
                                <tr key={item.key}>
                                    <th
                                        scope="row"
                                        className="py-2 pr-3 font-normal"
                                    >
                                        {item.label}
                                    </th>
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <td
                                            key={index}
                                            className="px-2 py-2 text-right"
                                        >
                                            {(
                                                score?.counts[index] ?? 0
                                            ).toLocaleString()}
                                        </td>
                                    ))}
                                    <td className="py-2 pl-2 text-right">
                                        {score?.average?.toFixed(1) ?? '—'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </details>
    );
}
