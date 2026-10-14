import { Link, router } from '@inertiajs/react';
import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { PublicEventRow } from '@/components/public/public-event-card';
import { PublicPage } from '@/components/public/public-page';
import { RegionSelect } from '@/components/public/region-select';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { index } from '@/routes/public-events';
import type { PublicEventPage } from '@/types/events';
import type { DirectoryOption } from '@/types/monitoring';
import '../../../css/public.css';

type Filters = { region: number | null; when: 'current' | 'past' };

const tabs: { value: Filters['when']; label: string }[] = [
    { value: 'current', label: 'Happening now & upcoming' },
    { value: 'past', label: 'Past' },
];

/** The list's address for these filters, the defaults left out. */
function listUrl({ region, when }: Filters): string {
    return index.url({
        query: {
            ...(region !== null ? { region } : {}),
            ...(when === 'past' ? { when } : {}),
        },
    });
}

/**
 * The public website's GAD events (docs/event-registration.md): those on now
 * and coming up, those on now first, or past ones, for a region (and every
 * region) or all of them. Each opens its own page, where visitors log in to
 * join. Nothing about who joined is shown.
 */
export default function PublicEvents({
    events,
    filters,
    regions,
}: {
    events: PublicEventPage;
    filters: Filters;
    regions: DirectoryOption[];
}) {
    const [loading, setLoading] = useState(false);
    const place =
        regions.find((option) => option.id === filters.region)?.name ?? null;

    function chooseRegion(region: number | null) {
        router.get(
            listUrl({ ...filters, region }),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    }

    return (
        <PublicPage
            title="GAD events"
            eyebrow="Events"
            back={{ href: home.url(), label: 'Back to home' }}
            description="Trainings, campaigns, and other GAD activities from CHED's regional offices and the Central Office. Times are Philippine time."
            metaDescription="GAD trainings, campaigns, and activities from CHED for higher education institutions across the regions."
        >
            <div className="public-container space-y-6 pb-24">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <nav
                        aria-label="Which events"
                        className="flex gap-1 border-b"
                    >
                        {tabs.map((tab) => (
                            <Link
                                key={tab.value}
                                href={listUrl({ ...filters, when: tab.value })}
                                preserveScroll
                                aria-current={
                                    tab.value === filters.when
                                        ? 'page'
                                        : undefined
                                }
                                className={cn(
                                    '-mb-px flex h-11 items-center border-b-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                    tab.value === filters.when
                                        ? 'border-foreground font-medium text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </nav>
                    {regions.length > 0 && (
                        <RegionSelect
                            id="events-region"
                            regions={regions}
                            value={filters.region}
                            onChange={chooseRegion}
                        />
                    )}
                </div>

                <section
                    aria-labelledby="events-list"
                    aria-busy={loading}
                    className={cn(
                        'overflow-hidden rounded-xl border bg-card transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    <h2
                        id="events-list"
                        className="border-b px-4 pt-4 pb-3 text-base font-medium sm:px-5"
                    >
                        {filters.when === 'past'
                            ? 'Past events'
                            : 'Happening now & upcoming'}
                        {place && (
                            <span className="font-normal text-muted-foreground">
                                {' '}
                                · {place} and every region
                            </span>
                        )}
                    </h2>
                    {events.data.length > 0 ? (
                        <ul className="divide-y">
                            {events.data.map((event) => (
                                <PublicEventRow
                                    key={event.ulid}
                                    event={event}
                                />
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center px-6 py-12 text-center">
                            <CalendarDays
                                aria-hidden
                                className="size-8 text-muted-foreground"
                            />
                            <p className="mt-3 font-medium">
                                {filters.when === 'past'
                                    ? 'No past events yet'
                                    : `No GAD events coming up${place ? ` for ${place}` : ''} right now`}
                            </p>
                            {filters.when === 'current' && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    <Link
                                        href={listUrl({
                                            ...filters,
                                            when: 'past',
                                        })}
                                        className="text-foreground underline underline-offset-4"
                                    >
                                        See past events
                                    </Link>
                                </p>
                            )}
                        </div>
                    )}
                    {events.data.length > 0 && (
                        <Pagination
                            page={events.meta}
                            label="events"
                            className="sm:px-5"
                        />
                    )}
                </section>
            </div>
        </PublicPage>
    );
}
