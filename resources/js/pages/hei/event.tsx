import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, Clock, MapPin, Users } from 'lucide-react';
import { EventCategoryLabel } from '@/components/hei/event-category';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { JoinCard } from '@/components/events/join-card';
import { JoinedMark } from '@/components/events/joined-mark';
import { RegistrationControls } from '@/components/events/registration-controls';
import { Button } from '@/components/ui/button';
import { certificateDates } from '@/lib/certificate-text';
import { eventPlace, formatEventTime } from '@/lib/event-dates';
import { index as eventsIndex } from '@/routes/events';
import { index as registrations } from '@/routes/admin/events/registrations';
import type {
    CertificateRequest,
    MyCertificate,
    RequestableCertificate,
} from '@/types/certificates';
import type { EventDetail, EventRegistration } from '@/types/events';
import { useLiveReload, useOwnChannel } from '@/hooks/use-live';

/**
 * A GAD event's page (docs/event-registration.md): what it is, joining it,
 * and once attended, its certificates. Staff of its office see who joined
 * and close or reopen registration. Its address can be shared.
 */
export default function EventPage({
    event,
    registration,
    attended,
    certificates,
    requestable,
    requests,
    can,
}: {
    event: EventDetail;
    registration: EventRegistration | null;
    attended: string[];
    certificates: MyCertificate[];
    requestable: RequestableCertificate[];
    requests: CertificateRequest[];
    can: { join: boolean; viewRegistrations: boolean; update: boolean };
}) {
    const live = [
        'event',
        'registration',
        'attended',
        'certificates',
        'requestable',
        'requests',
    ];
    useLiveReload([`record.event.${event.id}`], live);
    // Certificates released to them, or their request declined.
    useLiveReload(useOwnChannel(), live, { event: 'inbox' });

    const deadline = event.category === 'deadline';
    const manages = !deadline && (can.viewRegistrations || can.update);

    return (
        <>
            <Head title={event.title} />
            <div
                data-surface="hei"
                className="w-full px-4 pb-20 sm:px-6 lg:px-8"
            >
                <Link
                    href={eventsIndex()}
                    className="mt-4 -ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <ChevronLeft aria-hidden className="size-4" />
                    GAD events
                </Link>

                <header className="pt-2 pb-8">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <EventCategoryLabel
                            category={event.category}
                            className="text-sm"
                        />
                        <EventStatusBadge status={event.status} />
                        {registration && <JoinedMark />}
                    </div>
                    <h1 className="mt-2 max-w-3xl text-[1.75rem] leading-tight font-normal text-balance sm:text-[2rem]">
                        {event.title}
                    </h1>
                    <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
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
                            <span>
                                {eventPlace(event.region?.name ?? null)}
                            </span>
                        </li>
                    </ul>
                </header>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
                    <section
                        aria-labelledby="details"
                        className="min-w-0 rounded-xl border bg-card p-5"
                    >
                        <h2 id="details" className="font-medium">
                            Details
                        </h2>
                        <p className="mt-2 max-w-prose text-sm leading-relaxed text-pretty whitespace-pre-line">
                            {event.description ||
                                'CHED hasn’t added details for this event yet.'}
                        </p>
                    </section>

                    <div className="min-w-0 space-y-4 lg:sticky lg:top-6">
                        {!deadline && (
                            <JoinCard
                                event={event}
                                registration={registration}
                                attended={attended}
                                certificates={certificates}
                                requestable={requestable}
                                requests={requests}
                                canJoin={can.join}
                            />
                        )}
                        {manages && (
                            <section
                                aria-labelledby="manage"
                                className="space-y-3 rounded-xl border bg-card p-5"
                            >
                                <h2 id="manage" className="font-medium">
                                    Manage registration
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {can.viewRegistrations && (
                                        <Button asChild variant="outline">
                                            <Link
                                                href={registrations.url(
                                                    event.id,
                                                )}
                                            >
                                                <Users />
                                                See who joined
                                            </Link>
                                        </Button>
                                    )}
                                    {can.update && (
                                        <RegistrationControls event={event} />
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
