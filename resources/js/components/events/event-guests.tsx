import { router } from '@inertiajs/react';
import { ScrollText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import { GuestDialog } from '@/components/events/guest-dialog';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatCount } from '@/lib/dashboard';
import { destroy } from '@/routes/admin/events/guests';
import { store as giveCertificate } from '@/routes/admin/events/guests/certificates';
import type { EventCertificate } from '@/types/certificates';
import type { EventDetail, EventGuest, EventGuestPage } from '@/types/events';

/**
 * An event's guests without an account (docs/event-registration.md), on its
 * list of who joined: who they are, the days they came, and, for the staff
 * who release them, the certificates to give one who missed a day.
 */
export function EventGuests({
    event,
    guests,
    days,
    certificates,
    canManage,
}: {
    event: EventDetail;
    guests: EventGuestPage;
    /** The days that may be marked, Y-m-d. */
    days: string[];
    /** The event's certificates the viewer releases. */
    certificates: EventCertificate[];
    canManage: boolean;
}) {
    const released = certificates.filter(
        (certificate) => certificate.released_at !== null,
    );

    return (
        <section
            aria-labelledby="guests"
            className="overflow-hidden rounded-xl border bg-card"
        >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 pt-4 pb-3 sm:px-5">
                <h2 id="guests" className="font-medium">
                    {guests.meta.total === 1
                        ? '1 guest'
                        : `${formatCount(guests.meta.total)} guests`}
                </h2>
                {canManage && <GuestDialog event={event} days={days} />}
            </div>
            {guests.data.length > 0 ? (
                <ul className="divide-y">
                    {guests.data.map((guest) => (
                        <GuestItem
                            key={guest.id}
                            event={event}
                            guest={guest}
                            days={days}
                            released={released}
                            canManage={canManage}
                        />
                    ))}
                </ul>
            ) : (
                <p className="px-4 py-6 text-sm text-pretty text-muted-foreground sm:px-5">
                    No guests yet. Add people without a PHLGADIS account, such
                    as speakers or people from other agencies, to keep their
                    attendance and give them certificates.
                </p>
            )}
            {guests.data.length > 0 && (
                <Pagination
                    page={guests.meta}
                    label="guests"
                    className="sm:px-5"
                />
            )}
        </section>
    );
}

function GuestItem({
    event,
    guest,
    days,
    released,
    canManage,
}: {
    event: EventDetail;
    guest: EventGuest;
    days: string[];
    released: EventCertificate[];
    canManage: boolean;
}) {
    const [giving, setGiving] = useState<string | null>(null);
    // Present every day, it comes by itself; one who missed a day is the
    // office's to give, as a guest can't ask.
    const missedADay = guest.days.length > 0 && guest.days.length < days.length;
    const toGive = missedADay
        ? released.filter(
              (certificate) => !guest.certificates.includes(certificate.id),
          )
        : [];
    const held = released.filter((certificate) =>
        guest.certificates.includes(certificate.id),
    );

    function give(certificate: EventCertificate) {
        router.post(
            giveCertificate.url([event.id, guest.id]),
            { certificate: certificate.id },
            {
                preserveScroll: true,
                onStart: () => setGiving(certificate.id),
                onFinish: () => setGiving(null),
            },
        );
    }

    return (
        <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="min-w-0 flex-1">
                <p className="font-medium text-pretty">{guest.name}</p>
                <p className="text-[13px] text-pretty text-muted-foreground">
                    {[guest.position, guest.organization]
                        .filter(Boolean)
                        .join(', ')}
                </p>
                {held.length > 0 && (
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <ScrollText aria-hidden className="size-3.5" />
                        Has the{' '}
                        {held
                            .map((certificate) => certificate.title)
                            .join(' and ')}
                    </p>
                )}
            </div>
            <p className="shrink-0 text-[13px] tabular-nums sm:text-right">
                {guest.days.length === 0 ? (
                    <span className="text-muted-foreground">
                        No days marked
                    </span>
                ) : (
                    <span className="font-medium">
                        Came {guest.days.length}{' '}
                        {guest.days.length === 1 ? 'day' : 'days'}
                    </span>
                )}
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-1">
                {toGive.map((certificate) => (
                    <Button
                        key={certificate.id}
                        variant="outline"
                        size="sm"
                        disabled={giving !== null}
                        onClick={() => give(certificate)}
                    >
                        {giving === certificate.id && <Spinner />}
                        Give {certificate.title}
                    </Button>
                ))}
                {canManage && (
                    <>
                        <GuestDialog event={event} days={days} guest={guest} />
                        {guest.certificates.length === 0 && (
                            <ConfirmPopover
                                title={`Remove ${guest.name}?`}
                                description="They come off the event's list, with the days marked for them."
                                confirmLabel="Remove guest"
                                onConfirm={(visit) =>
                                    router.delete(
                                        destroy.url([event.id, guest.id]),
                                        { preserveScroll: true, ...visit },
                                    )
                                }
                            >
                                <Button variant="ghost" size="icon">
                                    <Trash2 />
                                    <span className="sr-only">
                                        Remove {guest.name}
                                    </span>
                                </Button>
                            </ConfirmPopover>
                        )}
                    </>
                )}
            </div>
        </li>
    );
}
