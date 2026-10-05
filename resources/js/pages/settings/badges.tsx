import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BadgeDialog } from '@/components/badges/badge-dialog';
import { Medal } from '@/components/badges/medal';
import { ConfirmPopover } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import {
    EmptyList,
    FilterBar,
    NoOfficeNotice,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { formatCount } from '@/lib/dashboard';
import { cn } from '@/lib/utils';
import { destroy, index, show, status } from '@/routes/settings/badges';
import type { BadgePage, BadgeRow } from '@/types/badges';
import type { DirectoryOption } from '@/types/monitoring';

type Props = {
    badges: BadgePage;
    filters: { search?: string };
    regions: DirectoryOption[];
    nationalAccess: boolean;
    hasOffice: boolean;
    permissions: { create: boolean };
};

/**
 * Settings → Community → Badges: the badges people earn by sharing GAD work
 * and the custom ones an office awards by hand (docs/badges.md).
 */
export default function Badges({
    badges,
    filters,
    regions,
    nationalAccess,
    hasOffice,
    permissions,
}: Props) {
    const { values, loading, filtered, apply, change, search } =
        useRecordFilters<{ search?: string }>(index.url(), filters);

    return (
        <>
            <Head title="Badges" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl min-w-0">
                        <Heading
                            variant="small"
                            title="Badges"
                            description="Badges show on people's profiles. Some are earned by sharing GAD work or finishing a GAD Quest; the rest you award by hand, for things worth marking."
                        />
                    </div>
                    {permissions.create && (
                        <BadgeDialog
                            badge={null}
                            regions={regions}
                            nationalAccess={nationalAccess}
                        >
                            <Button className="shrink-0">
                                <Plus />
                                New badge
                            </Button>
                        </BadgeDialog>
                    )}
                </div>

                {!hasOffice && <NoOfficeNotice noun="badges" />}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter badges"
                        filters={0}
                        className="border-b-0"
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Badge name"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                    </FilterBar>
                </div>

                <section
                    aria-label="Badges"
                    aria-busy={loading}
                    className={cn(
                        'overflow-hidden rounded-xl border bg-card transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    {badges.data.length > 0 ? (
                        <ul className="divide-y">
                            {badges.data.map((badge) => (
                                <BadgeItem
                                    key={badge.id}
                                    badge={badge}
                                    regions={regions}
                                    nationalAccess={nationalAccess}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'No badges match this search'
                                    : 'No badges yet'
                            }
                            text={
                                filtered
                                    ? 'Try another name, or clear the search.'
                                    : 'Create a badge to award by hand.'
                            }
                            onClear={() => change({})}
                        />
                    )}
                    {badges.data.length > 0 && (
                        <Pagination
                            page={badges.meta}
                            label="badges"
                            className="sm:px-5"
                        />
                    )}
                </section>
            </div>
        </>
    );
}

function BadgeItem({
    badge,
    regions,
    nationalAccess,
}: {
    badge: BadgeRow;
    regions: DirectoryOption[];
    nationalAccess: boolean;
}) {
    const [busy, setBusy] = useState(false);
    const holders = badge.holders ?? 0;

    return (
        <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
            <div className="flex min-w-0 flex-1 gap-4">
                <Medal
                    kind={badge.medal}
                    image={badge.image}
                    className={cn('size-14', !badge.is_active && 'opacity-50')}
                />
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                        <Link
                            href={show.url(badge.id)}
                            className="font-medium underline-offset-2 hover:underline"
                        >
                            {badge.name}
                        </Link>
                        {!badge.is_active && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                Off
                            </span>
                        )}
                    </p>
                    <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
                        {badge.description}
                    </p>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                        {badge.criterion
                            ? `Earned by: ${badge.criterion}`
                            : 'Awarded by hand'}
                        {' · '}
                        {badge.region?.name ?? 'Every region'}
                        {' · '}
                        <span className="tabular-nums">
                            {holders === 1
                                ? '1 holder'
                                : `${formatCount(holders)} holders`}
                        </span>
                    </p>
                </div>
            </div>
            {(badge.can.update || badge.can.delete) && (
                <div className="flex shrink-0 items-center gap-1 pl-18 sm:pl-0">
                    {badge.can.update && (
                        <>
                            {badge.can.switch && (
                                <Switch
                                    checked={badge.is_active}
                                    disabled={busy}
                                    aria-label={`Give out ${badge.name}`}
                                    onCheckedChange={(active) =>
                                        router.patch(
                                            status.url(badge.id),
                                            { is_active: active },
                                            {
                                                preserveScroll: true,
                                                onStart: () => setBusy(true),
                                                onFinish: () => setBusy(false),
                                            },
                                        )
                                    }
                                    className="mr-2"
                                />
                            )}
                            <BadgeDialog
                                badge={badge}
                                regions={regions}
                                nationalAccess={nationalAccess}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-11"
                                >
                                    <Pencil />
                                    <span className="sr-only">
                                        Edit {badge.name}
                                    </span>
                                </Button>
                            </BadgeDialog>
                        </>
                    )}
                    {badge.can.delete && (
                        <ConfirmPopover
                            title={`Delete ${badge.name}?`}
                            description={
                                holders > 0
                                    ? `${holders === 1 ? '1 person holds' : `${formatCount(holders)} people hold`} it; it leaves their profiles too. To stop giving it, switch it off instead.`
                                    : 'Nobody holds it yet.'
                            }
                            confirmLabel="Delete"
                            onConfirm={(visit) =>
                                router.delete(destroy.url(badge.id), {
                                    preserveScroll: true,
                                    ...visit,
                                })
                            }
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-11 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 />
                                <span className="sr-only">
                                    Delete {badge.name}
                                </span>
                            </Button>
                        </ConfirmPopover>
                    )}
                </div>
            )}
        </li>
    );
}
