import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { BetaTag } from '@/components/beta-tag';
import { selectClass } from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import type { PaginationMeta } from '@/components/pagination';
import { QuestStatusPill } from '@/components/quests/quest-status';
import { QuestTabs } from '@/components/quests/quest-tabs';
import {
    EmptyList,
    Filter,
    FilterBar,
    NoOfficeNotice,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { formatCount } from '@/lib/dashboard';
import { localDate } from '@/lib/manila-time';
import { cn } from '@/lib/utils';
import { create, index, show } from '@/routes/quests/manage';
import type { DirectoryOption } from '@/types/monitoring';
import type { ManagedQuest } from '@/types/quests';

type Filters = { search?: string; region?: string };

/**
 * GAD Quest for its staff: the quests of the office's region (every
 * region's for the Central Office), newest change first.
 */
export default function ManageQuests({
    quests,
    filters,
    regions,
    hasOffice,
    canPlay,
    permissions,
}: {
    quests: { data: ManagedQuest[]; meta: PaginationMeta };
    filters: Filters;
    regions: DirectoryOption[];
    hasOffice: boolean;
    canPlay: boolean;
    permissions: { create: boolean };
}) {
    const { values, loading, filtered, apply, change, search } =
        useRecordFilters<Filters>(index.url(), filters);
    const pickRegion = regions.length > 1;

    return (
        <>
            <Head title="GAD Quest" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="mb-2 text-sm text-muted-foreground">
                            Community
                        </p>
                        <h1 className="flex items-center gap-2 text-3xl font-medium tracking-tight">
                            GAD Quest
                            <BetaTag />
                        </h1>
                        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                            Short quizzes for a GAD activity, campaign or event.
                            Write five easy questions, open the quest, and the
                            people of its region play it. Each answer is
                            explained, and finishing earns a badge.
                        </p>
                    </div>
                    {permissions.create && (
                        <Button asChild className="shrink-0">
                            <Link href={create.url()}>
                                <Plus />
                                New quest
                            </Link>
                        </Button>
                    )}
                </header>

                {canPlay && <QuestTabs current="manage" />}
                {!hasOffice && <NoOfficeNotice noun="quests" />}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter quests"
                        filters={pickRegion ? 1 : 0}
                        className="border-b-0"
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Quest title"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                        {pickRegion && (
                            <Filter label="Region" id="region">
                                <FormSelect
                                    id="region"
                                    className={selectClass}
                                    value={values.region ?? ''}
                                    onChange={(region) =>
                                        change({ ...values, region })
                                    }
                                    placeholder="All regions"
                                    allowEmpty
                                    emptyLabel="All regions"
                                    options={regions.map((region) => ({
                                        value: String(region.id),
                                        label: region.name,
                                    }))}
                                />
                            </Filter>
                        )}
                    </FilterBar>
                </div>

                <section
                    aria-label="Quests"
                    aria-busy={loading}
                    className={cn(
                        'overflow-hidden rounded-xl border bg-card transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    {quests.data.length > 0 ? (
                        <ul className="divide-y">
                            {quests.data.map((quest) => (
                                <QuestRow key={quest.id} quest={quest} />
                            ))}
                        </ul>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'No quests match these filters'
                                    : 'No quests yet'
                            }
                            text={
                                filtered
                                    ? 'Try another title or region, or clear the filters.'
                                    : 'Write the first one for your next GAD activity. It stays a draft until you open it.'
                            }
                            onClear={() => change({})}
                        />
                    )}
                    {quests.data.length > 0 && (
                        <Pagination
                            page={quests.meta}
                            label="quests"
                            persistent
                            className="sm:px-5"
                        />
                    )}
                </section>
            </div>
        </>
    );
}

function QuestRow({ quest }: { quest: ManagedQuest }) {
    return (
        <li className="relative flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5 md:grid md:grid-cols-[minmax(0,1fr)_6rem_7rem_9rem] md:items-center md:gap-4">
            <div className="min-w-0">
                <Link
                    href={show.url(quest.id)}
                    className="font-medium outline-none after:absolute after:inset-0 hover:underline focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring"
                >
                    {quest.title}
                </Link>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {quest.region?.name ?? 'All regions'}
                    {quest.created_by && ` · by ${quest.created_by}`}
                </p>
            </div>
            <div>
                <QuestStatusPill status={quest.status} />
            </div>
            <p className="text-sm tabular-nums">
                {formatCount(quest.completed ?? 0)}
                <span className="text-muted-foreground">
                    {' '}
                    of {formatCount(quest.players ?? 0)} finished
                </span>
            </p>
            <p className="text-[13px] text-muted-foreground">
                {quest.updated_at && `Updated ${localDate(quest.updated_at)}`}
            </p>
        </li>
    );
}

ManageQuests.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'GAD Quest', href: '/quests/manage' },
    ],
};
