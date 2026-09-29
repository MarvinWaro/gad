import { useForm } from '@inertiajs/react';
import { CircleCheck, Download, ExternalLink, Undo2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import MonitoringReviewController from '@/actions/App/Http/Controllers/Admin/MonitoringReviewController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { MonitoringReport, MonitoringRevision } from '@/types/monitoring';
import { Field, fieldClass, localDate, panelClass } from './shared';

type Decision = 'reviewed' | 'returned';

/**
 * The reviewer's side: the signed copy beside the answers, and the decision.
 * On narrow screens the copy opens in its own tab instead.
 */
export function ReviewPanel({
    report,
    revision,
    canReview,
}: {
    report: MonitoringReport;
    revision: MonitoringRevision;
    canReview: boolean;
}) {
    const [decision, setDecision] = useState<Decision | null>(null);
    const form = useForm({
        lock_version: report.lock_version,
        decision: 'reviewed' as Decision,
        comment: '',
    });
    const errors: Partial<Record<string, string>> = form.errors;
    const attachment = revision.attachment;

    function start(next: Decision) {
        form.clearErrors();
        form.setData({
            lock_version: report.lock_version,
            decision: next,
            comment: '',
        });
        setDecision(next);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(MonitoringReviewController.review.url(report.id), {
            preserveScroll: true,
            onSuccess: () => setDecision(null),
        });
    }

    return (
        <section
            aria-labelledby="signed-copy-heading"
            className={`${panelClass} space-y-4`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2
                        id="signed-copy-heading"
                        className="text-lg font-medium"
                    >
                        Signed copy
                    </h2>
                    {revision.document_code && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            Every page should show document code{' '}
                            <span className="font-mono font-medium text-foreground">
                                {revision.document_code}
                            </span>
                            .
                        </p>
                    )}
                </div>
                {attachment && (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                            <a
                                href={attachment.inline_url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink />
                                Open
                                <span className="sr-only">
                                    {' '}
                                    the signed copy in a new tab
                                </span>
                            </a>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <a href={attachment.url}>
                                <Download />
                                Download
                                <span className="sr-only">
                                    {' '}
                                    the signed copy
                                </span>
                            </a>
                        </Button>
                    </div>
                )}
            </div>
            {attachment ? (
                <iframe
                    src={attachment.inline_url}
                    title={`Signed copy, revision ${revision.number}`}
                    className="hidden h-[70vh] w-full rounded-lg border bg-muted lg:block"
                />
            ) : (
                <p className="text-sm text-muted-foreground">
                    No signed copy was sent with this revision.
                </p>
            )}
            {canReview && (
                <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => start('returned')}
                    >
                        <Undo2 />
                        Return for correction
                    </Button>
                    <Button type="button" onClick={() => start('reviewed')}>
                        <CircleCheck />
                        Mark as reviewed
                    </Button>
                </div>
            )}
            <Dialog
                open={decision !== null}
                onOpenChange={(open) => {
                    if (!open) setDecision(null);
                }}
            >
                <DialogContent>
                    <form onSubmit={submit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>
                                {decision === 'returned'
                                    ? 'Return for correction'
                                    : 'Mark as reviewed'}
                            </DialogTitle>
                            <DialogDescription>
                                {decision === 'returned'
                                    ? 'The HEI gets a new revision with the same answers to correct, sign and send again. This one stays on record.'
                                    : 'This records that CHED reviewed the report and its signed copy. It does not certify legal compliance.'}
                            </DialogDescription>
                        </DialogHeader>
                        <Field
                            label={
                                decision === 'returned'
                                    ? 'What should the HEI correct?'
                                    : 'Note to the HEI (optional)'
                            }
                            id="review-comment"
                            error={
                                errors.comment ??
                                errors.report ??
                                errors.lock_version
                            }
                        >
                            <textarea
                                id="review-comment"
                                rows={5}
                                className={fieldClass}
                                value={form.data.comment}
                                onChange={(event) =>
                                    form.setData('comment', event.target.value)
                                }
                                required={decision === 'returned'}
                                maxLength={10000}
                                aria-invalid={Boolean(errors.comment)}
                            />
                        </Field>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDecision(null)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {decision === 'returned'
                                    ? 'Return to the HEI'
                                    : 'Mark as reviewed'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </section>
    );
}

/** CHED's decisions on one revision, oldest first. */
export function ReviewHistory({ revision }: { revision: MonitoringRevision }) {
    if (revision.reviews.length === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="reviews-heading"
            className={`${panelClass} space-y-4`}
        >
            <h2 id="reviews-heading" className="text-lg font-medium">
                CHED review
            </h2>
            <ol className="space-y-4">
                {revision.reviews.map((review) => (
                    <li
                        key={review.id}
                        className="border-t pt-4 first:border-0 first:pt-0"
                    >
                        <p className="text-sm font-medium">
                            {review.decision === 'returned'
                                ? 'Returned for correction'
                                : 'Reviewed'}{' '}
                            · {review.reviewer}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {localDate(review.created_at)}
                        </p>
                        {review.comment && (
                            <p className="mt-3 text-sm break-words whitespace-pre-wrap">
                                {review.comment}
                            </p>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    );
}
