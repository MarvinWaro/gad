import { Head, Link } from '@inertiajs/react';
import { CalendarCheck, ExternalLink, ScrollText } from 'lucide-react';
import { DownloadCertificateButton } from '@/components/certificates/download-certificate-button';
import Heading from '@/components/heading';
import { EventDateBlock } from '@/components/hei/upcoming-events';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { certificateDates } from '@/lib/certificate-text';
import { eventStatuses } from '@/lib/event-dates';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { index as eventsIndex, show as eventPage } from '@/routes/events';
import type { MyCertificatePage } from '@/types/certificates';
import type { JoinedEvent, JoinedEventPage } from '@/types/events';

/**
 * Settings → My certificates: the certificates released to you for the GAD
 * events you were checked in to (docs/certificates.md), to download as PDFs;
 * then the events you joined (docs/event-registration.md).
 */
export default function MyCertificates({
    certificates,
    events,
}: {
    certificates: MyCertificatePage;
    events: JoinedEventPage;
}) {
    return (
        <>
            <Head title="My certificates" />

            <h1 className="sr-only">My certificates</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="My certificates"
                    description="Certificates from the GAD events you attended. Download them as PDFs to print or share; each has a QR code anyone can scan to check it."
                />

                {certificates.data.length > 0 ? (
                    <section
                        aria-label="Certificates"
                        className="overflow-hidden rounded-xl border bg-card"
                    >
                        <ul className="divide-y">
                            {certificates.data.map((certificate) => (
                                <li
                                    key={certificate.id}
                                    className="flex gap-4 px-4 py-4 sm:px-5"
                                >
                                    <span
                                        aria-hidden
                                        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
                                    >
                                        <ScrollText className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">
                                            {certificate.title}
                                        </p>
                                        <p className="mt-0.5 text-sm text-pretty">
                                            {certificate.event?.title}
                                        </p>
                                        <p className="mt-1 text-[13px] text-muted-foreground">
                                            {certificate.event &&
                                                certificateDates(
                                                    certificate.event.starts_at,
                                                    certificate.event.ends_at,
                                                )}
                                            {certificate.office &&
                                                ` · ${certificate.office}`}
                                        </p>
                                        <p className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
                                            No. {certificate.number}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <DownloadCertificateButton
                                                id={certificate.id}
                                                label={`Download ${certificate.title ?? 'certificate'} for ${certificate.event?.title ?? 'the event'}`}
                                                compact
                                            />
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="min-h-10"
                                            >
                                                <a
                                                    href={
                                                        certificate.verify_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink aria-hidden />
                                                    Verify page
                                                    <span className="sr-only">
                                                        (opens in a new tab)
                                                    </span>
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Pagination
                            page={certificates.meta}
                            label="certificates"
                            className="sm:px-5"
                        />
                    </section>
                ) : (
                    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
                        <ScrollText
                            aria-hidden
                            className="size-8 text-muted-foreground"
                        />
                        <p className="mt-3 font-medium">No certificates yet</p>
                        <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
                            When you attend a GAD event and staff release its
                            certificates, they appear here.
                        </p>
                    </div>
                )}

                <JoinedEvents events={events} />
            </div>
        </>
    );
}

const statusBadges: Record<
    JoinedEvent['status'],
    { tone: keyof typeof tones; label: (days: number) => string }
> = {
    // Worded as the events lists word them (eventStatuses).
    upcoming: {
        tone: eventStatuses.upcoming.tone,
        label: () => eventStatuses.upcoming.label,
    },
    ongoing: {
        tone: eventStatuses.ongoing.tone,
        label: () => eventStatuses.ongoing.label,
    },
    attended: {
        tone: 'positive',
        label: (days) => `Attended ${days} ${days === 1 ? 'day' : 'days'}`,
    },
    missed: { tone: 'neutral', label: () => 'Didn’t check in' },
    cancelled: {
        tone: eventStatuses.cancelled.tone,
        label: () => eventStatuses.cancelled.label,
    },
};

/**
 * The events you joined (docs/event-registration.md), newest first: how
 * each went for you, and whether it gave you a certificate.
 */
function JoinedEvents({ events }: { events: JoinedEventPage }) {
    return (
        <section aria-labelledby="joined-events" className="space-y-3">
            <div>
                <h2 id="joined-events" className="font-medium">
                    Events you joined
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">
                    Show your Virtual ID at the registration table. Only people
                    who joined and were checked in get an event&apos;s
                    certificates.
                </p>
            </div>

            {events.data.length > 0 ? (
                <div className="overflow-hidden rounded-xl border bg-card">
                    <ul className="divide-y">
                        {events.data.map((joined) => {
                            const badge = statusBadges[joined.status];

                            return (
                                <li
                                    key={joined.id}
                                    className="flex gap-4 px-4 py-4 sm:px-5"
                                >
                                    <EventDateBlock
                                        value={joined.event.starts_at}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={eventPage(joined.event)}
                                            className="rounded-sm font-medium text-pretty underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            {joined.event.title}
                                        </Link>
                                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                                            {certificateDates(
                                                joined.event.starts_at,
                                                joined.event.ends_at,
                                            )}
                                            {` · ${joined.event.region ?? 'Every region'}`}
                                        </p>
                                        <p className="mt-2 flex flex-wrap gap-2">
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-xs font-medium',
                                                    tones[badge.tone].badge,
                                                )}
                                            >
                                                {badge.label(
                                                    joined.days_attended,
                                                )}
                                            </span>
                                            {joined.has_certificate && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                                                    <ScrollText
                                                        aria-hidden
                                                        className="size-3.5"
                                                    />
                                                    Certificate ready
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <Pagination
                        page={events.meta}
                        label="events"
                        only={['events']}
                        className="sm:px-5"
                    />
                </div>
            ) : (
                <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
                    <CalendarCheck
                        aria-hidden
                        className="size-8 text-muted-foreground"
                    />
                    <p className="mt-3 font-medium">No events joined yet</p>
                    <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
                        Open an event on the{' '}
                        <Link
                            href={eventsIndex()}
                            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            GAD events calendar
                        </Link>{' '}
                        and join it. It shows here, with its certificate once
                        released.
                    </p>
                </div>
            )}
        </section>
    );
}
