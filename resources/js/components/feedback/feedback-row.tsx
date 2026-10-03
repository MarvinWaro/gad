import { router } from '@inertiajs/react';
import { ChevronDown, Mail, Trash2 } from 'lucide-react';
import { ConfirmPopover } from '@/components/confirm-popover';
import { feedbackTypeIcons } from '@/components/feedback/type-tiles';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { localDate } from '@/lib/manila-time';
import { destroy } from '@/routes/admin/feedback';
import type { FeedbackQuestions, SiteFeedback } from '@/types/feedback';

/**
 * One feedback in the staff list: its type, opening lines, place, sender and
 * time. "Details" opens the full text and every answer under it.
 */
export function FeedbackRow({
    feedback,
    questions,
    canDelete,
}: {
    feedback: SiteFeedback;
    questions: FeedbackQuestions;
    canDelete: boolean;
}) {
    const Icon = feedbackTypeIcons[feedback.type.code];
    const { region, hei } = feedback.place;
    const place = [hei, region].filter(Boolean).join(' · ');
    const sender = [feedback.contact.name, feedback.contact.email]
        .filter(Boolean)
        .join(' · ');

    return (
        <Collapsible asChild>
            <li className="px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium sm:w-44">
                        {Icon && (
                            <Icon
                                aria-hidden="true"
                                className="size-3.5 shrink-0 text-muted-foreground"
                            />
                        )}
                        {feedback.type.label}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm break-words whitespace-pre-line">
                            {feedback.feedback}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {[
                                place || 'No place given',
                                sender || 'No name or email',
                                localDate(feedback.submitted_at),
                            ].join(' · ')}
                        </p>
                    </div>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="group/details shrink-0 self-start"
                        >
                            Details
                            <span className="sr-only">
                                {' '}
                                of the {feedback.type.label.toLowerCase()}{' '}
                                feedback from {localDate(feedback.submitted_at)}
                            </span>
                            <ChevronDown className="transition-transform group-data-[state=open]/details:rotate-180" />
                        </Button>
                    </CollapsibleTrigger>
                </div>
                {/* Contained, so long lines never widen the list. */}
                <CollapsibleContent className="[contain:inline-size]">
                    <div className="mt-3 space-y-5 rounded-lg bg-muted/50 p-4 sm:ml-47">
                        <Text label="Feedback" value={feedback.feedback} />
                        <Text
                            label="Suggestions for improvement"
                            value={feedback.suggestions}
                        />
                        <Answers feedback={feedback} questions={questions} />
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="text-sm">
                                <p className="text-xs text-muted-foreground">
                                    Sent by
                                </p>
                                {sender ? (
                                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2">
                                        {feedback.contact.name}
                                        {feedback.contact.email && (
                                            <a
                                                href={`mailto:${feedback.contact.email}`}
                                                className="inline-flex items-center gap-1 underline decoration-muted-foreground underline-offset-4 hover:decoration-current"
                                            >
                                                <Mail
                                                    aria-hidden="true"
                                                    className="size-3.5"
                                                />
                                                {feedback.contact.email}
                                            </a>
                                        )}
                                    </p>
                                ) : (
                                    <p className="mt-0.5 text-muted-foreground">
                                        No name or email given
                                    </p>
                                )}
                            </div>
                            {canDelete && (
                                <ConfirmPopover
                                    title="Delete this feedback?"
                                    description="Its text and answers are removed for good, and the figures above update."
                                    confirmLabel="Delete"
                                    onConfirm={(visit) =>
                                        router.delete(
                                            destroy.url(feedback.id),
                                            {
                                                preserveScroll: true,
                                                ...visit,
                                            },
                                        )
                                    }
                                >
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 />
                                        Delete
                                    </Button>
                                </ConfirmPopover>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </li>
        </Collapsible>
    );
}

function Text({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 text-sm break-words whitespace-pre-line">
                {value ?? (
                    <span className="text-muted-foreground">Not given</span>
                )}
            </p>
        </div>
    );
}

/** Each rated question with its answer, in the form's order. */
function Answers({
    feedback,
    questions,
}: {
    feedback: SiteFeedback;
    questions: FeedbackQuestions;
}) {
    const rows = [
        ...questions.choices.map((question) => {
            const value = feedback.answers[question.key];

            return {
                key: question.key,
                label: question.label,
                answer:
                    question.options.find((option) => option.value === value)
                        ?.label ?? null,
            };
        }),
        ...questions.scales.flatMap((scale) =>
            scale.items.map((item) => {
                const value = feedback.answers[item.key];

                return {
                    key: item.key,
                    label: item.label,
                    answer: value === null ? null : `${value} of 5`,
                };
            }),
        ),
    ];

    return (
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
            {rows.map((row) => (
                <div key={row.key} className="contents">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd
                        className={
                            row.answer === null
                                ? 'mb-1 text-muted-foreground sm:mb-0'
                                : 'mb-1 font-medium tabular-nums sm:mb-0'
                        }
                    >
                        {row.answer ?? 'Not answered'}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
