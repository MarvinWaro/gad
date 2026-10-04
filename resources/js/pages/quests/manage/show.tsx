import { Head, Link, router } from '@inertiajs/react';
import { Check, ChevronLeft, Pencil, Play, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BetaTag } from '@/components/beta-tag';
import { ConfirmPopover } from '@/components/confirm-popover';
import { Pagination } from '@/components/pagination';
import { LevelMark } from '@/components/quests/quest-badge';
import { QuestStatusPill } from '@/components/quests/quest-status';
import {
    EmptyList,
    FilterBar,
    PlaceFilters,
    placeFilterCount,
    useRecordFilters,
} from '@/components/record-filters';
import { SexLegend, SexSplitBar } from '@/components/sex-split-bar';
import { StatTile } from '@/components/stat-tile';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { formatCount } from '@/lib/dashboard';
import { localDate } from '@/lib/manila-time';
import { cn } from '@/lib/utils';
import {
    destroy,
    edit,
    index,
    retakes,
    show,
    status,
} from '@/routes/quests/manage';
import type { DirectoryOption, ReportFilters } from '@/types/monitoring';
import type {
    ManagedQuest,
    QuestParticipantPage,
    QuestSummary,
} from '@/types/quests';

type Props = {
    quest: ManagedQuest;
    summary: QuestSummary;
    participants: QuestParticipantPage;
    filters: ReportFilters;
    regions: DirectoryOption[];
    heis: DirectoryOption[];
    canPlay: boolean;
    permissions: { update: boolean; delete: boolean };
};

/**
 * One quest for its staff: opening and closing it, retakes, who played and
 * how they did (each player once, by their best attempt), and its questions
 * with their answers.
 */
export default function QuestResults({
    quest,
    summary,
    participants,
    filters,
    regions,
    heis,
    permissions,
}: Props) {
    const { values, loading, filtered, change, pick } = useRecordFilters(
        show.url(quest.id),
        filters,
    );
    const [busy, setBusy] = useState(false);
    const visit = {
        preserveScroll: true,
        onStart: () => setBusy(true),
        onFinish: () => setBusy(false),
    };
    const { female, male, not_stated: notStated } = summary.by_sex;

    return (
        <>
            <Head title={quest.title} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <Link
                            href={index.url()}
                            className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ChevronLeft aria-hidden className="size-4" />
                            GAD Quest
                            <BetaTag className="ml-1" />
                        </Link>
                        <h1 className="mt-2 text-3xl font-medium tracking-tight text-balance">
                            {quest.title}
                        </h1>
                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                            <QuestStatusPill status={quest.status} />
                            <span>
                                {quest.region?.name ?? 'All regions'}
                                {quest.created_by &&
                                    ` · by ${quest.created_by}`}
                                {quest.published_at &&
                                    ` · opened ${localDate(quest.published_at)}`}
                            </span>
                        </p>
                        {quest.description && (
                            <p className="mt-3 max-w-3xl text-sm">
                                {quest.description}
                            </p>
                        )}
                    </div>
                    {permissions.update && (
                        <div className="flex shrink-0 flex-wrap gap-2">
                            <Button asChild variant="outline">
                                <Link href={edit.url(quest.id)}>
                                    <Pencil />
                                    Edit
                                </Link>
                            </Button>
                            {quest.status === 'open' ? (
                                <ConfirmPopover
                                    title="Close this quest?"
                                    description="Players can no longer start or finish it. Everyone keeps the badge they earned, and you can open it again."
                                    confirmLabel="Close quest"
                                    onConfirm={(confirm) =>
                                        router.patch(
                                            status.url(quest.id),
                                            { status: 'closed' },
                                            {
                                                preserveScroll: true,
                                                ...confirm,
                                            },
                                        )
                                    }
                                >
                                    <Button variant="outline">
                                        <Square />
                                        Close
                                    </Button>
                                </ConfirmPopover>
                            ) : (
                                <Button
                                    disabled={busy}
                                    onClick={() =>
                                        router.patch(
                                            status.url(quest.id),
                                            { status: 'open' },
                                            visit,
                                        )
                                    }
                                >
                                    {busy ? <Spinner /> : <Play />}
                                    {quest.status === 'draft'
                                        ? 'Open quest'
                                        : 'Open again'}
                                </Button>
                            )}
                            {permissions.delete && !quest.played && (
                                <ConfirmPopover
                                    title="Delete this quest?"
                                    description="Its questions are deleted with it. Nobody has played it yet."
                                    confirmLabel="Delete"
                                    onConfirm={(confirm) =>
                                        router.delete(destroy.url(quest.id), {
                                            ...confirm,
                                        })
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 />
                                        Delete
                                    </Button>
                                </ConfirmPopover>
                            )}
                        </div>
                    )}
                </header>

                {quest.status === 'draft' && (
                    <p
                        role="status"
                        className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm"
                    >
                        This quest is a draft, so nobody can see it yet. Check
                        the questions below, then open it for{' '}
                        {quest.region
                            ? `the people of ${quest.region.name}`
                            : 'every region'}
                        . The questions lock once someone plays.
                    </p>
                )}

                {permissions.update && (
                    <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-4 sm:p-5">
                        <div>
                            <p
                                id="retakes-label"
                                className="text-sm font-medium"
                            >
                                Let players retake it
                            </p>
                            <p
                                id="retakes-hint"
                                className="mt-1 text-sm text-muted-foreground"
                            >
                                Off: each person plays once. On: those who
                                finished can play again, and their best score
                                counts.
                            </p>
                        </div>
                        <Switch
                            checked={quest.allow_retakes}
                            disabled={busy}
                            aria-labelledby="retakes-label"
                            aria-describedby="retakes-hint"
                            onCheckedChange={(allowed) =>
                                router.patch(
                                    retakes.url(quest.id),
                                    { allow_retakes: allowed },
                                    visit,
                                )
                            }
                        />
                    </div>
                )}

                <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile
                        label="Players"
                        value={formatCount(summary.players)}
                        note="Started the quest"
                    />
                    <StatTile
                        label="Finished"
                        value={formatCount(summary.completed)}
                        note={`Answered all ${summary.questions} questions`}
                    />
                    <StatTile
                        label="Perfect scores"
                        value={formatCount(summary.perfect)}
                        note="Champion badges"
                    />
                    <StatTile
                        label="Average score"
                        value={
                            summary.average === null
                                ? '—'
                                : `${summary.average}%`
                        }
                        note="Of those who finished, best attempt each"
                    />
                </dl>

                <section
                    aria-labelledby="by-sex"
                    className="rounded-xl border bg-card p-4 sm:p-5"
                >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 id="by-sex" className="font-medium">
                            Who finished, by sex
                        </h2>
                        <SexLegend />
                    </div>
                    <SexSplitBar
                        female={female}
                        male={male}
                        parity
                        className="mt-4"
                    />
                    <p className="mt-3 text-sm text-muted-foreground tabular-nums">
                        {formatCount(female)} female · {formatCount(male)} male
                        {notStated > 0 &&
                            ` · ${formatCount(notStated)} not stated in their profile`}
                    </p>
                </section>

                <section
                    aria-labelledby="participants"
                    className="overflow-hidden rounded-xl border bg-card"
                >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 pt-4 pb-3 sm:px-5">
                        <h2 id="participants" className="font-medium">
                            Participants
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Best score first. Only staff who run this quest see
                            this list.
                        </p>
                    </div>
                    <div className="@container">
                        <FilterBar
                            label="Filter participants"
                            filters={placeFilterCount(regions)}
                        >
                            <PlaceFilters
                                values={values}
                                onPick={pick}
                                regions={regions}
                                heis={heis}
                            />
                        </FilterBar>
                    </div>
                    <div
                        aria-busy={loading}
                        className={cn(
                            'transition-opacity',
                            loading && 'opacity-60',
                        )}
                    >
                        {participants.data.length > 0 ? (
                            <ul className="divide-y">
                                {participants.data.map((participant) => (
                                    <li
                                        key={participant.user_id}
                                        className="flex flex-col gap-2 px-4 py-3 sm:px-5 md:grid md:grid-cols-[minmax(0,1fr)_12rem_7rem_8rem] md:items-center md:gap-4"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {participant.name}
                                            </p>
                                            <p className="text-[13px] text-muted-foreground">
                                                {participant.place}
                                            </p>
                                        </div>
                                        {participant.level &&
                                        participant.best !== null ? (
                                            <p className="flex items-center gap-2 text-sm">
                                                <LevelMark
                                                    level={participant.level}
                                                    className="size-7"
                                                />
                                                <span className="tabular-nums">
                                                    {participant.best} of{' '}
                                                    {summary.questions}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {participant.level_label}
                                                </span>
                                            </p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Still playing
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground tabular-nums">
                                            {participant.attempts === 1
                                                ? '1 attempt'
                                                : `${participant.attempts} attempts`}
                                        </p>
                                        <p className="text-[13px] text-muted-foreground">
                                            {participant.last_played &&
                                                localDate(
                                                    participant.last_played,
                                                )}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyList
                                filtered={filtered}
                                title={
                                    filtered
                                        ? 'Nobody from there has played'
                                        : 'Nobody has played yet'
                                }
                                text={
                                    filtered
                                        ? 'Try another place, or clear the filters.'
                                        : quest.status === 'open'
                                          ? 'Players appear here as soon as they start the quest.'
                                          : 'Players appear here once the quest is open and they start it.'
                                }
                                onClear={() => change({})}
                            />
                        )}
                        <Pagination
                            page={participants}
                            label="participants"
                            className="sm:px-5"
                        />
                    </div>
                </section>

                {quest.questions && (
                    <section aria-labelledby="questions" className="space-y-3">
                        <h2 id="questions" className="font-medium">
                            Questions and answers
                        </h2>
                        <ol className="space-y-3">
                            {quest.questions.map((question, number) => (
                                <li
                                    key={number}
                                    className="rounded-xl border bg-card p-4 sm:p-5"
                                >
                                    <p className="font-medium">
                                        <span className="text-muted-foreground">
                                            {number + 1}.
                                        </span>{' '}
                                        {question.prompt}
                                    </p>
                                    <ul className="mt-3 space-y-1.5 text-sm">
                                        {question.choices.map(
                                            (choice, position) => (
                                                <li
                                                    key={position}
                                                    className={cn(
                                                        'flex items-start gap-2',
                                                        position !==
                                                            question.correct &&
                                                            'text-muted-foreground',
                                                    )}
                                                >
                                                    {position ===
                                                    question.correct ? (
                                                        <Check
                                                            aria-hidden
                                                            className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                                                        />
                                                    ) : (
                                                        <span
                                                            aria-hidden
                                                            className="size-4 shrink-0"
                                                        />
                                                    )}
                                                    <span>
                                                        {choice}
                                                        {position ===
                                                            question.correct && (
                                                            <span className="sr-only">
                                                                {' '}
                                                                (correct)
                                                            </span>
                                                        )}
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                    <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                                        {question.explanation}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </div>
        </>
    );
}

QuestResults.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'GAD Quest', href: '/quests/manage' },
    ],
};
