import { Link } from '@inertiajs/react';
import { CalendarDays, Clock, LogIn, MapPin, Users } from 'lucide-react';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { EventCategoryLabel } from '@/components/hei/event-category';
import { PublicPage } from '@/components/public/public-page';
import { Button } from '@/components/ui/button';
import { certificateDates } from '@/lib/certificate-text';
import {
    eventPlace,
    formatEventTime,
    registrationNote,
} from '@/lib/event-dates';
import { register } from '@/routes';
import { index as myEvents, show as memberEvent } from '@/routes/events';
import { index as publicEvents } from '@/routes/public-events';
import type { PublicEvent } from '@/types/events';
import '../../../css/public.css';

/** The page's description for search results and shared links. */
function summary(event: PublicEvent): string {
    const text = event.description?.replace(/\s+/g, ' ').trim();

    return text
        ? text.slice(0, 160)
        : `A GAD event ${eventPlace(event.region).toLowerCase()}, on ${certificateDates(event.starts_at, event.ends_at)}.`;
}

/**
 * An event's public page (docs/event-registration.md): what it is, when and
 * where, and whose region, then how to join: visitors log in, or register,
 * and land on the event's own page to join it. Someone signed in from
 * another region is told whose event it is. Nothing about who joined.
 */
export default function PublicEventPage({
    event,
    signedIn,
}: {
    event: PublicEvent;
    /** Signed in, but it isn't their region's event. */
    signedIn: boolean;
}) {
    const ended = event.status === 'ended';

    return (
        <PublicPage
            title={event.title}
            eyebrow="GAD event"
            back={{ href: publicEvents.url(), label: 'All GAD events' }}
            metaDescription={summary(event)}
        >
            <div className="public-container pb-24">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <div className="min-w-0 space-y-6">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <EventCategoryLabel
                                category={event.category}
                                className="text-sm"
                            />
                            <EventStatusBadge status={event.status} />
                        </div>
                        <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <CalendarDays
                                    aria-hidden
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                <span>
                                    {certificateDates(
                                        event.starts_at,
                                        event.ends_at,
                                    )}
                                </span>
                            </li>
                            <li className="flex items-start gap-2 tabular-nums">
                                <Clock
                                    aria-hidden
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                <span>
                                    {formatEventTime(event)}, Philippine time
                                </span>
                            </li>
                            {event.location && (
                                <li className="flex items-start gap-2">
                                    <MapPin
                                        aria-hidden
                                        className="mt-0.5 size-4 shrink-0"
                                    />
                                    <span className="min-w-0 break-words">
                                        {event.location}
                                    </span>
                                </li>
                            )}
                            <li className="flex items-start gap-2">
                                <Users
                                    aria-hidden
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                <span>{eventPlace(event.region)}</span>
                            </li>
                        </ul>
                        <section
                            aria-labelledby="details"
                            className="rounded-xl border bg-card p-5"
                        >
                            <h2 id="details" className="text-base font-medium">
                                Details
                            </h2>
                            <p className="mt-2 max-w-prose text-sm leading-relaxed text-pretty whitespace-pre-line">
                                {event.description ||
                                    'CHED hasn’t added details for this event yet.'}
                            </p>
                        </section>
                    </div>

                    <section
                        aria-labelledby="join"
                        className="min-w-0 space-y-4 rounded-xl border bg-card p-5 lg:sticky lg:top-28"
                    >
                        <div className="space-y-1">
                            <h2 id="join" className="text-base font-medium">
                                Join this event
                            </h2>
                            <p className="text-sm text-pretty text-muted-foreground">
                                {registrationNote({
                                    ...event,
                                    ended,
                                    cancelled: event.status === 'cancelled',
                                })}
                            </p>
                        </div>
                        {signedIn ? (
                            <p className="text-sm text-pretty">
                                This event is for HEIs of {event.region}. Events
                                for your region and for every region are on{' '}
                                <Link
                                    href={myEvents()}
                                    className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    your GAD events calendar
                                </Link>
                                .
                            </p>
                        ) : (
                            event.registration_open && (
                                <>
                                    <p className="text-sm text-pretty">
                                        Joining takes a PHLGADIS account from
                                        your institution. Staff check you in by
                                        your Virtual ID at the registration
                                        table.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button asChild>
                                            <Link href={memberEvent(event)}>
                                                <LogIn />
                                                Log in to join
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline">
                                            <Link href={register()}>
                                                Register
                                            </Link>
                                        </Button>
                                    </div>
                                </>
                            )
                        )}
                    </section>
                </div>
            </div>
        </PublicPage>
    );
}
