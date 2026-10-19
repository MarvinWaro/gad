import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, UserMinus } from 'lucide-react';
import { ReleaseBadge } from '@/components/certificates/event-uses';
import { ConfirmPopover } from '@/components/confirm-popover';
import { AddPersonDialog } from '@/components/events/add-person-dialog';
import { AttendanceDialog } from '@/components/events/attendance-dialog';
import { EventGuests } from '@/components/events/event-guests';
import { joinedCount } from '@/components/events/join-card';
import { RegistrationControls } from '@/components/events/registration-controls';
import { Pagination } from '@/components/pagination';
import { PersonAvatar } from '@/components/person-avatar';
import {
    EmptyList,
    FilterBar,
    PlaceFilters,
    placeFilterCount,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { certificateDates } from '@/lib/certificate-text';
import { formatCount } from '@/lib/dashboard';
import { registrationNote } from '@/lib/event-dates';
import { localDay } from '@/lib/manila-time';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as eventsIndex } from '@/routes/admin/events';
import { destroy, index } from '@/routes/admin/events/registrations';
import { show as eventPage } from '@/routes/events';
import { show as releasePage } from '@/routes/settings/event-certificates';
import type { EventCertificate } from '@/types/certificates';
import type {
    EventDetail,
    EventGuestPage,
    EventRegistration,
    EventRegistrationPage,
} from '@/types/events';
import type { DirectoryOption } from '@/types/monitoring';
import { useLiveReload } from '@/hooks/use-live';

type Filters = { search?: string; region?: string; hei?: string };

/**
 * Who joined a GAD event (docs/event-registration.md), for its staff: how
 * many came, each person and how often they were checked in, closing or
 * reopening registration, the event's certificates, and keeping the list by
 * hand: adding people and guests, and marking the days they came.
 */
export default function EventRegistrations({
    event,
    counts,
    registrations,
    guests,
    days,
    certificates,
    can,
    filters,
    regions,
    heis,
}: {
    event: EventDetail;
    counts: { joined: number; checked_in: number; guests: number };
    registrations: EventRegistrationPage;
    guests: EventGuestPage;
    /** The days staff may mark, Y-m-d: the event's own, up to today. */
    days: string[];
    certificates: EventCertificate[];
    can: { update: boolean };
    filters: Filters;
    regions: DirectoryOption[];
    heis: DirectoryOption[];
}) {
    useLiveReload(
        [`record.event.${event.id}`],
        ['event', 'counts', 'registrations', 'guests', 'certificates'],
    );

    const { values, loading, filtered, apply, change, search, pick } =
        useRecordFilters<Filters>(index.url(event.id), filters);
    // The list is kept by hand at any event but a deadline or a cancelled one.
    const manages =
        can.update && event.category !== 'deadline' && !event.cancelled;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Events', href: eventsIndex() },
            { title: 'Who joined', href: index.url(event.id) },
        ],
    });

    return (
        <>
            <Head title={`Who joined: ${event.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Link
                    href={eventPage(event)}
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <ChevronLeft aria-hidden className="size-4" />
                    Event page
                </Link>

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <header className="min-w-0 space-y-1">
                        <p className="text-sm text-muted-foreground">
                            Who joined
                        </p>
                        <h1 className="text-2xl font-medium text-pretty">
                            {event.title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {certificateDates(event.starts_at, event.ends_at)}
                            {event.location && ` · ${event.location}`}
                            {' · '}
                            {event.region?.name ?? 'Every region'}
                        </p>
                        <p className="text-sm text-pretty">
                            {registrationNote(event)}
                        </p>
                    </header>
                    {manages && (
                        <div className="flex shrink-0 flex-wrap items-start gap-2">
                            <AddPersonDialog event={event} days={days} />
                            <RegistrationControls event={event} />
                        </div>
                    )}
                </div>

                {event.cancelled && (
                    <p
                        role="status"
                        className={cn(
                            'rounded-lg px-4 py-3 text-sm',
                            tones.danger.badge,
                        )}
                    >
                        This event was cancelled. Its list stays as it was;
                        restore the event to change it.
                    </p>
                )}

                <dl className="grid grid-cols-3 gap-3 sm:max-w-md">
                    {(
                        [
                            ['Joined', counts.joined],
                            ['Checked in', counts.checked_in],
                            ['Guests', counts.guests],
                        ] as const
                    ).map(([label, count]) => (
                        <div
                            key={label}
                            className="rounded-xl border bg-card px-4 py-3"
                        >
                            <dt className="text-sm text-muted-foreground">
                                {label}
                            </dt>
                            <dd className="mt-0.5 text-2xl font-medium tabular-nums">
                                {formatCount(count)}
                            </dd>
                        </div>
                    ))}
                </dl>

                {certificates.length > 0 && (
                    <section
                        aria-labelledby="certificates"
                        className="space-y-2"
                    >
                        <h2 id="certificates" className="font-medium">
                            Certificates
                        </h2>
                        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                            {certificates.map((certificate) => (
                                <li key={certificate.id}>
                                    <Link
                                        href={releasePage.url(certificate.id)}
                                        className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                    >
                                        <span className="min-w-0 flex-1 text-sm font-medium">
                                            {certificate.title}
                                            {certificate.design && (
                                                <span className="block text-[13px] font-normal text-muted-foreground">
                                                    {certificate.design.name}
                                                </span>
                                            )}
                                        </span>
                                        <ReleaseBadge use={certificate} />
                                        <ChevronRight
                                            aria-hidden
                                            className="size-4 shrink-0 text-muted-foreground"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter people who joined"
                        filters={placeFilterCount(regions)}
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Name"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                        <PlaceFilters
                            values={values}
                            onPick={pick}
                            regions={regions}
                            heis={heis}
                        />
                    </FilterBar>
                </div>

                <section
                    aria-labelledby="people"
                    aria-busy={loading}
                    className={cn(
                        'overflow-hidden rounded-xl border bg-card transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    <h2
                        id="people"
                        className="border-b px-4 pt-4 pb-3 font-medium sm:px-5"
                    >
                        {joinedCount(registrations.meta.total)}
                        {filtered && ' (filtered)'}
                    </h2>
                    {registrations.data.length > 0 ? (
                        <ul className="divide-y">
                            {registrations.data.map((registration) => (
                                <RegistrantItem
                                    key={registration.id}
                                    event={event}
                                    registration={registration}
                                    days={days}
                                    manages={manages}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'No one matches these filters'
                                    : 'No one has joined yet'
                            }
                            text={
                                filtered
                                    ? 'Try another name, or clear the filters.'
                                    : 'People join from the event’s page. Share its link so they find it.'
                            }
                            onClear={() => change({})}
                        />
                    )}
                    {registrations.data.length > 0 && (
                        <Pagination
                            page={registrations.meta}
                            label="people"
                            className="sm:px-5"
                        />
                    )}
                </section>

                {(manages || guests.meta.total > 0) && (
                    <EventGuests
                        event={event}
                        guests={guests}
                        days={days}
                        certificates={certificates}
                        canManage={manages}
                    />
                )}
            </div>
        </>
    );
}

function RegistrantItem({
    event,
    registration,
    days,
    manages,
}: {
    event: EventDetail;
    registration: EventRegistration;
    days: string[];
    manages: boolean;
}) {
    const { person } = registration;
    const name = person.name ?? 'Someone';

    return (
        <li className="flex items-start gap-3 px-4 py-3 sm:items-center sm:px-5">
            <PersonAvatar name={name} src={person.avatar} className="size-10" />
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium text-pretty">
                        {person.name}
                        {registration.added && (
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 text-xs font-medium',
                                    tones.info.badge,
                                )}
                            >
                                Added by staff
                            </span>
                        )}
                    </p>
                    <p className="text-[13px] text-pretty text-muted-foreground">
                        {[person.affiliation, person.region]
                            .filter(Boolean)
                            .join(' · ')}
                    </p>
                </div>
                <RegistrantStatus registration={registration} />
            </div>
            {manages && (
                <div className="flex shrink-0 items-center">
                    <AttendanceDialog
                        event={event}
                        registration={registration}
                        days={days}
                    />
                    {(registration.days_attended ?? 0) === 0 && (
                        <ConfirmPopover
                            title={`Take ${name} off the list?`}
                            description="They can join again while registration is open."
                            confirmLabel="Take off"
                            onConfirm={(visit) =>
                                router.delete(
                                    destroy.url([event.id, registration.id]),
                                    { preserveScroll: true, ...visit },
                                )
                            }
                        >
                            <Button variant="ghost" size="icon">
                                <UserMinus />
                                <span className="sr-only">
                                    Take {name} off the list
                                </span>
                            </Button>
                        </ConfirmPopover>
                    )}
                </div>
            )}
        </li>
    );
}

function RegistrantStatus({
    registration,
}: {
    registration: EventRegistration;
}) {
    const days = registration.days_attended ?? 0;

    return (
        <div className="shrink-0 text-[13px] tabular-nums sm:text-right">
            <p
                className={cn(
                    days > 0 ? 'font-medium' : 'text-muted-foreground',
                )}
            >
                {days === 0
                    ? 'Not checked in yet'
                    : `Attended ${days} ${days === 1 ? 'day' : 'days'}`}
            </p>
            <p className="text-muted-foreground">
                Joined {localDay(registration.joined_at)}
            </p>
        </div>
    );
}
