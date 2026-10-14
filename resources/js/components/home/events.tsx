import { Link, router } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { PublicEventCard } from '@/components/public/public-event-card';
import { RegionSelect } from '@/components/public/region-select';
import { SectionHeading } from '@/components/public/shared';
import { Button } from '@/components/ui/button';
import { withQueryValue } from '@/lib/query';
import { cn } from '@/lib/utils';
import { index as publicEvents } from '@/routes/public-events';
import type { HomepageEvents } from '@/types/events';

/**
 * "GAD events" on the homepage (docs/event-registration.md): the next few
 * events still on, those on now first, for a region or every region, and a
 * way to the full list. Only real events: with none, it says so.
 */
export function Events({ region, regions, events }: HomepageEvents) {
    const [loading, setLoading] = useState(false);
    const place = regions.find((option) => option.id === region)?.name ?? null;
    const query = region !== null ? { region } : {};

    function chooseRegion(next: number | null) {
        router.get(
            '/',
            withQueryValue(
                window.location.search,
                'events_region',
                next === null ? null : String(next),
            ),
            {
                only: ['events'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    }

    return (
        <section id="events" className="public-container public-section">
            <SectionHeading
                label="GAD events"
                title="Be part of what's happening."
                description={
                    place
                        ? `Trainings, campaigns, and activities for ${place} and for every region. Events on now come first.`
                        : 'Trainings, campaigns, and activities across the regions. Events on now come first.'
                }
            >
                {regions.length > 0 && (
                    <div className="statistics-filters">
                        <RegionSelect
                            id="events-region"
                            regions={regions}
                            value={region}
                            onChange={chooseRegion}
                        />
                    </div>
                )}
            </SectionHeading>

            <div
                aria-busy={loading}
                className={cn(
                    'transition-opacity',
                    loading && 'statistics-loading',
                )}
            >
                {events.length === 0 ? (
                    <p className="stories-empty">
                        No GAD events
                        {place ? ` for ${place}` : ''} are on or coming up right
                        now.{' '}
                        <Link
                            href={publicEvents.url({
                                query: { ...query, when: 'past' },
                            })}
                            className="text-foreground underline underline-offset-4"
                        >
                            See past events
                        </Link>
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                        {events.map((event) => (
                            <PublicEventCard key={event.ulid} event={event} />
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6">
                <Button asChild variant="ghost" className="text-action">
                    <Link href={publicEvents.url({ query })}>
                        See all events
                        <ArrowUpRight />
                    </Link>
                </Button>
            </div>
        </section>
    );
}
