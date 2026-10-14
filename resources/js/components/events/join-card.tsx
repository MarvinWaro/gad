import { Link, router, usePage } from '@inertiajs/react';
import {
    CircleCheck,
    IdCard,
    LogOut,
    ScrollText,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { DownloadCertificateButton } from '@/components/certificates/download-certificate-button';
import { ConfirmPopover } from '@/components/confirm-popover';
import { RequestCertificateDialog } from '@/components/events/request-certificate-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { attendedDays } from '@/lib/certificate-text';
import { formatCount } from '@/lib/dashboard';
import { eventDayKeys, registrationNote } from '@/lib/event-dates';
import { localDay } from '@/lib/manila-time';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { index as myCertificates } from '@/routes/my-certificates';
import { destroy, store } from '@/routes/events/registration';
import { show as virtualId } from '@/routes/virtual-id';
import type {
    CertificateRequest,
    MyCertificate,
    RequestableCertificate,
} from '@/types/certificates';
import type { EventDetail, EventRegistration } from '@/types/events';

/** "No one has joined yet", "1 person joined", "1,204 people joined". */
export function joinedCount(count: number): string {
    if (count === 0) {
        return 'No one has joined yet';
    }

    return `${count === 1 ? '1 person' : `${formatCount(count)} people`} joined`;
}

/**
 * Joining an event from its page (docs/event-registration.md), and what
 * comes after: the Virtual ID to show at the table, leaving while
 * registration is open, then the days attended and the certificates, or a
 * request for one after missing a day (docs/certificates.md).
 */
export function JoinCard({
    event,
    registration,
    attended,
    certificates,
    requestable,
    requests,
    canJoin,
}: {
    event: EventDetail;
    registration: EventRegistration | null;
    /** The Philippine days you were checked in on, Y-m-d. */
    attended: string[];
    certificates: MyCertificate[];
    /** The event's released certificates you may ask for. */
    requestable: RequestableCertificate[];
    /** What you asked for at this event. */
    requests: CertificateRequest[];
    canJoin: boolean;
}) {
    const { errors } = usePage().props;
    const problem = (errors as Partial<Record<string, string>>).registration;
    const [joining, setJoining] = useState(false);
    const joined = registration !== null;

    function join() {
        router.post(
            store.url(event),
            {},
            {
                preserveScroll: true,
                onStart: () => setJoining(true),
                onFinish: () => setJoining(false),
            },
        );
    }

    return (
        <section
            aria-labelledby="registration"
            className="space-y-4 rounded-xl border bg-card p-5"
        >
            <div className="space-y-1">
                <h2 id="registration" className="font-medium">
                    {attended.length > 0
                        ? 'You attended'
                        : joined
                          ? 'You joined'
                          : 'Join this event'}
                </h2>
                <p className="text-sm text-pretty text-muted-foreground">
                    {registrationNote(event)}
                </p>
                {event.joined_count !== undefined && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
                        <Users aria-hidden className="size-4 shrink-0" />
                        {joinedCount(event.joined_count)}
                    </p>
                )}
            </div>

            {problem && (
                <p
                    role="alert"
                    className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        tones.danger.badge,
                    )}
                >
                    {problem}
                </p>
            )}

            {attended.length > 0 ? (
                <Attended
                    event={event}
                    days={attended}
                    certificates={certificates}
                    requestable={requestable}
                    requests={requests}
                />
            ) : joined ? (
                <div className="space-y-4">
                    <p className="flex items-start gap-2 text-sm">
                        <CircleCheck
                            aria-hidden
                            className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                        />
                        <span>
                            {registration.added
                                ? `CHED added you to the list on ${localDay(registration.joined_at)}.`
                                : `Joined ${localDay(registration.joined_at)}.`}{' '}
                            Show your Virtual ID at the registration table so
                            staff can check you in.
                        </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link href={virtualId()}>
                                <IdCard />
                                Open your Virtual ID
                            </Link>
                        </Button>
                        {event.registration_open && canJoin && (
                            <ConfirmPopover
                                title="Leave this event?"
                                description={`You can join “${event.title}” again while registration is open.`}
                                confirmLabel="Leave event"
                                onConfirm={(visit) =>
                                    router.delete(destroy.url(event), {
                                        preserveScroll: true,
                                        ...visit,
                                    })
                                }
                            >
                                <Button
                                    variant="ghost"
                                    className="px-3 text-muted-foreground hover:text-destructive"
                                >
                                    <LogOut />
                                    Leave event
                                </Button>
                            </ConfirmPopover>
                        )}
                    </div>
                </div>
            ) : event.registration_open && canJoin ? (
                <div className="space-y-2">
                    <Button
                        type="button"
                        className="w-full sm:w-auto"
                        disabled={joining}
                        onClick={join}
                    >
                        {joining ? <Spinner /> : <UserPlus />}
                        Join event
                    </Button>
                    <p className="text-[13px] text-pretty text-muted-foreground">
                        Staff check you in by your Virtual ID. Only people who
                        joined get the event&apos;s certificates.
                    </p>
                </div>
            ) : (
                !event.ended &&
                !event.cancelled && (
                    <p className="text-sm text-pretty text-muted-foreground">
                        Coming without joining? Sign the paper attendance sheet
                        at the registration table.
                    </p>
                )
            )}
        </section>
    );
}

function Attended({
    event,
    days,
    certificates,
    requestable,
    requests,
}: {
    event: EventDetail;
    days: string[];
    certificates: MyCertificate[];
    requestable: RequestableCertificate[];
    requests: CertificateRequest[];
}) {
    // Certificates go by themselves to people present every day.
    const missedADay = days.length < eventDayKeys(event).length;
    const asked = requests.filter((request) => request.status !== 'approved');

    return (
        <div className="space-y-4">
            <p className="flex items-start gap-2 text-sm">
                <CircleCheck
                    aria-hidden
                    className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                />
                <span>Checked in on {attendedDays(days)}.</span>
            </p>
            {certificates.length > 0 ? (
                <ul className="space-y-2">
                    {certificates.map((certificate) => (
                        <li
                            key={certificate.id}
                            className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                        >
                            <span
                                aria-hidden
                                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
                            >
                                <ScrollText className="size-4" />
                            </span>
                            <p className="min-w-0 flex-1 text-sm font-medium">
                                {certificate.title}
                            </p>
                            <DownloadCertificateButton
                                id={certificate.id}
                                label={`Download ${certificate.title ?? 'certificate'}`}
                                compact
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                !missedADay && (
                    <p className="text-sm text-pretty text-muted-foreground">
                        Your certificate appears in{' '}
                        <Link
                            href={myCertificates()}
                            className="rounded-sm text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            My certificates
                        </Link>{' '}
                        when the event ends.
                    </p>
                )
            )}
            {asked.length > 0 && (
                <ul className="space-y-2">
                    {asked.map((request) => (
                        <li
                            key={request.id}
                            className="rounded-lg border p-3 text-sm text-pretty"
                        >
                            {request.status === 'pending' ? (
                                <>
                                    You asked for the{' '}
                                    {request.title ?? 'certificate'} on{' '}
                                    {localDay(request.requested_at)}. CHED tells
                                    you once it answers.
                                </>
                            ) : (
                                <>
                                    CHED declined your request for the{' '}
                                    {request.title ?? 'certificate'}
                                    {request.note ? `: ${request.note}` : '.'}
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {missedADay && !event.cancelled && (
                <div className="space-y-2">
                    <p className="text-sm text-pretty text-muted-foreground">
                        Certificates go by themselves to people present on every
                        day.{' '}
                        {requestable.length > 0
                            ? 'Missed one? You can ask for yours.'
                            : event.ended
                              ? ''
                              : 'Missed one? Once they go out at the end, you can ask for yours here.'}
                    </p>
                    {requestable.length > 0 && (
                        <RequestCertificateDialog
                            event={event}
                            certificates={requestable}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
