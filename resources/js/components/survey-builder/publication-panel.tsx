import { Link, useForm } from '@inertiajs/react';
import {
    ArrowUpRight,
    CheckCircle2,
    CircleAlert,
    ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { countLabel, formatWhen } from '@/components/survey-builder/definition';
import { FormSection } from '@/components/survey-builder/form-section';
import type {
    BuilderSurvey,
    DirectoryStatus,
    Draft,
    ReadinessCheck,
} from '@/components/survey-builder/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * What the public sees now, what still blocks this draft, and the button
 * that publishes it.
 */
export function PublicationPanel({
    survey,
    draft,
    directoryStatus,
    readiness,
    canPublishDrafts,
    hasUnsavedChanges,
}: {
    survey: BuilderSurvey;
    draft: Draft;
    directoryStatus: DirectoryStatus;
    readiness: ReadinessCheck[];
    /** The publish permission. */
    canPublishDrafts: boolean;
    /** Publishing uses the last saved draft, so edits must be saved first. */
    hasUnsavedChanges: boolean;
}) {
    const [publishOpen, setPublishOpen] = useState(false);
    const [publishBlocked, setPublishBlocked] = useState(false);
    const publishForm = useForm({});

    const blockers = readiness.filter((check) => !check.passed);
    const savedAt = formatWhen(draft.updated_at);
    const publishedAt = formatWhen(survey.published_at);
    const canPublish =
        canPublishDrafts && blockers.length === 0 && !hasUnsavedChanges;

    const publishHint = !canPublishDrafts
        ? 'Publishing needs the publish permission. Ask an administrator to release this draft.'
        : hasUnsavedChanges
          ? 'Save your changes first. Publishing uses the last saved draft.'
          : blockers.length > 0
            ? `${blockers.length} ${blockers.length === 1 ? 'item' : 'items'} above still needs attention.`
            : `Draft v${draft.version} is ready to replace what respondents see.`;

    function publish() {
        publishForm.post(`/admin/surveys/${survey.id}/publish`, {
            preserveScroll: true,
            onSuccess: () => {
                setPublishOpen(false);
                setPublishBlocked(false);
            },
            onError: () => {
                setPublishOpen(false);
                setPublishBlocked(true);
            },
        });
    }

    return (
        <>
            <FormSection
                title="Publication"
                description={`Everything below edits draft v${draft.version} only. Respondents keep seeing the live version until you publish.`}
                className="@min-[88rem]:grid-cols-1"
                railClassName="@min-[88rem]:static"
            >
                <Card className="gap-0 py-0">
                    <CardContent className="space-y-8 py-6">
                        <section>
                            <h3 className="text-sm font-medium">
                                What the public sees
                            </h3>
                            {survey.published_version ? (
                                <div className="mt-3 rounded-lg border p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        Live · version{' '}
                                        {survey.published_version}
                                    </p>
                                    {publishedAt && (
                                        <p className="mt-1.5 text-sm text-muted-foreground">
                                            Published {publishedAt}
                                        </p>
                                    )}
                                    {survey.public_url && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                        >
                                            <a
                                                href={survey.public_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open public page
                                                <ExternalLink />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-3 rounded-lg border border-dashed p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                                        Nothing published yet
                                    </p>
                                    <p className="mt-1.5 text-sm text-muted-foreground">
                                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                            /surveys/{survey.slug}
                                        </code>{' '}
                                        still shows a being-prepared notice, and
                                        its card on the home page reads Opening
                                        soon. Publishing draft v{draft.version}{' '}
                                        replaces both.
                                    </p>
                                </div>
                            )}
                            <p className="mt-3 text-sm text-muted-foreground">
                                Draft v{draft.version}
                                {savedAt ? ` · saved ${savedAt}` : ''}
                            </p>
                        </section>

                        <section>
                            <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
                                Before this draft can go live
                                <span className="font-normal text-muted-foreground">
                                    {readiness.length - blockers.length} of{' '}
                                    {readiness.length} ready
                                </span>
                            </h3>
                            {publishBlocked && blockers.length > 0 && (
                                <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                    Publishing was blocked. Clear the items
                                    below, then try again.
                                </p>
                            )}
                            <ul className="mt-3 space-y-2">
                                {readiness.map((check) => (
                                    <ReadinessItem
                                        key={check.key}
                                        check={check}
                                        directoryStatus={directoryStatus}
                                    />
                                ))}
                            </ul>
                        </section>
                    </CardContent>
                    <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between @min-[88rem]:flex-col @min-[88rem]:items-stretch">
                        <p className="text-sm text-muted-foreground">
                            {publishHint}
                        </p>
                        {canPublishDrafts && (
                            <Button
                                type="button"
                                disabled={!canPublish}
                                onClick={() => setPublishOpen(true)}
                                className="sm:shrink-0 @min-[88rem]:w-full"
                            >
                                Publish draft v{draft.version}
                            </Button>
                        )}
                    </div>
                </Card>
            </FormSection>

            <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Publish draft v{draft.version}?
                        </DialogTitle>
                        <DialogDescription>
                            This changes what respondents see straight away.
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                        <li>
                            Draft v{draft.version} becomes the live
                            questionnaire at{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                /surveys/{survey.slug}
                            </code>
                            .
                        </li>
                        {survey.published_version !== null && (
                            <li>
                                Version {survey.published_version} is kept as a
                                superseded record, and responses already
                                collected against it stay linked to it.
                            </li>
                        )}
                        <li>
                            A fresh draft v{draft.version + 1} opens, so you can
                            keep editing without touching the live survey.
                        </li>
                    </ul>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPublishOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={publish}
                            disabled={publishForm.processing}
                        >
                            {publishForm.processing
                                ? 'Publishing…'
                                : `Publish v${draft.version}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ReadinessItem({
    check,
    directoryStatus,
}: {
    check: ReadinessCheck;
    directoryStatus: DirectoryStatus;
}) {
    return (
        <li
            className={cn(
                'rounded-lg border p-3',
                check.passed
                    ? 'border-transparent bg-muted/50'
                    : 'border-amber-500/40 bg-amber-500/5',
            )}
        >
            <div className="flex gap-2.5">
                {check.passed ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                ) : (
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                )}
                <div className="min-w-0 flex-1">
                    <p
                        className={cn(
                            'text-sm',
                            check.passed
                                ? 'text-muted-foreground'
                                : 'font-medium',
                        )}
                    >
                        {check.label}
                    </p>
                    {!check.passed && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {check.detail}
                        </p>
                    )}
                    {check.key === 'directories' && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {countLabel(
                                directoryStatus.regions,
                                'active region',
                            )}{' '}
                            · {countLabel(directoryStatus.heis, 'HEI')}
                        </p>
                    )}
                    {!check.passed && check.href && (
                        <Button
                            asChild
                            variant="link"
                            size="sm"
                            className="mt-1 h-auto p-0"
                        >
                            <Link href={check.href}>
                                Manage directories
                                <ArrowUpRight />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </li>
    );
}
