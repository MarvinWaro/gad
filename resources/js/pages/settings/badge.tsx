import { Head, Link, router } from '@inertiajs/react';
import { ChevronLeft, Undo2 } from 'lucide-react';
import { AwardDialog } from '@/components/badges/award-dialog';
import { Medal } from '@/components/badges/medal';
import { ConfirmPopover } from '@/components/confirm-popover';
import { Pagination } from '@/components/pagination';
import { PersonAvatar } from '@/components/person-avatar';
import {
    EmptyList,
    FilterBar,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { formatCount } from '@/lib/dashboard';
import { localDate } from '@/lib/manila-time';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/settings/badges';
import { destroy as revoke } from '@/routes/settings/badges/awards';
import type { BadgeHolderPage, BadgeRow } from '@/types/badges';

/**
 * One badge in Settings → Badges: what it is, who holds it (an office sees
 * its own region's holders of a national badge), and, for a custom badge,
 * Award and take back.
 */
export default function BadgeHolders({
    badge,
    holders,
    filters,
}: {
    badge: BadgeRow;
    holders: BadgeHolderPage;
    filters: { search?: string };
}) {
    const { values, loading, filtered, apply, change, search } =
        useRecordFilters<{ search?: string }>(show.url(badge.id), filters);
    const total = holders.meta.total;

    return (
        <>
            <Head title={badge.name} />
            <div className="space-y-6">
                <Link
                    href={index.url()}
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronLeft aria-hidden className="size-4" />
                    Badges
                </Link>

                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                        <Medal
                            kind={badge.medal}
                            image={badge.image}
                            className="size-20"
                        />
                        <div className="min-w-0">
                            <h1 className="text-xl font-medium">
                                {badge.name}
                                {!badge.is_active && (
                                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-xs font-normal text-muted-foreground">
                                        Off
                                    </span>
                                )}
                            </h1>
                            <p className="mt-1 text-sm text-pretty text-muted-foreground">
                                {badge.description}
                            </p>
                            <p className="mt-2 text-[13px] text-muted-foreground">
                                {badge.criterion
                                    ? `Earned by: ${badge.criterion}`
                                    : 'Awarded by hand'}
                                {' · '}
                                {badge.region?.name ?? 'Every region'}
                            </p>
                        </div>
                    </div>
                    {badge.can.award && <AwardDialog badge={badge} />}
                </header>

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter holders"
                        filters={0}
                        className="border-b-0"
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Name"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                    </FilterBar>
                </div>

                <section
                    aria-labelledby="holders"
                    aria-busy={loading}
                    className={cn(
                        'overflow-hidden rounded-xl border bg-card transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    <h2
                        id="holders"
                        className="border-b px-4 pt-4 pb-3 font-medium sm:px-5"
                    >
                        {total === 1
                            ? '1 holder'
                            : `${formatCount(total)} holders`}
                    </h2>
                    {holders.data.length > 0 ? (
                        <ul className="divide-y">
                            {holders.data.map((holder) => (
                                <li
                                    key={holder.id}
                                    className="flex items-center gap-3 px-4 py-3 sm:px-5"
                                >
                                    <PersonAvatar
                                        name={holder.person.name}
                                        src={holder.person.avatar}
                                        className="size-10"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">
                                            {holder.person.name}
                                        </p>
                                        <p className="text-[13px] text-muted-foreground">
                                            {holder.person.place}
                                            {' · '}
                                            {holder.awarded_by
                                                ? `Awarded by ${holder.awarded_by}`
                                                : badge.criterion
                                                  ? 'Earned'
                                                  : 'Awarded'}
                                            {' · '}
                                            {localDate(holder.awarded_at)}
                                        </p>
                                        {holder.note && (
                                            <p className="mt-0.5 text-sm text-pretty">
                                                For {holder.note}
                                            </p>
                                        )}
                                    </div>
                                    {badge.can.award && (
                                        <ConfirmPopover
                                            title={`Take ${badge.name} back from ${holder.person.name}?`}
                                            description="It leaves their profile. You can award it again later."
                                            confirmLabel="Take back"
                                            onConfirm={(visit) =>
                                                router.delete(
                                                    revoke.url({
                                                        badge: badge.id,
                                                        award: holder.id,
                                                    }),
                                                    {
                                                        preserveScroll: true,
                                                        ...visit,
                                                    },
                                                )
                                            }
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-11 shrink-0 text-muted-foreground hover:text-destructive"
                                            >
                                                <Undo2 />
                                                <span className="sr-only">
                                                    Take {badge.name} back from{' '}
                                                    {holder.person.name}
                                                </span>
                                            </Button>
                                        </ConfirmPopover>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'Nobody by that name holds it'
                                    : 'Nobody holds it yet'
                            }
                            text={
                                filtered
                                    ? 'Try another name, or clear the search.'
                                    : badge.criterion
                                      ? 'People earn it as they share GAD work.'
                                      : 'Award it to someone with the Award button.'
                            }
                            onClear={() => change({})}
                        />
                    )}
                    {holders.data.length > 0 && (
                        <Pagination
                            page={holders.meta}
                            label="holders"
                            className="sm:px-5"
                        />
                    )}
                </section>
            </div>
        </>
    );
}
