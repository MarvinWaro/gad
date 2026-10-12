import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, RefreshCw, Send, Trash2, Undo2 } from 'lucide-react';
import { DownloadCertificateButton } from '@/components/certificates/download-certificate-button';
import { ReleaseBadge } from '@/components/certificates/event-uses';
import { ConfirmPopover } from '@/components/confirm-popover';
import { Pagination } from '@/components/pagination';
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
import { localDay } from '@/lib/manila-time';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import {
    index as designs,
    show as design,
} from '@/routes/settings/certificates';
import {
    destroy,
    refresh,
    release,
    show,
    status,
} from '@/routes/settings/event-certificates';
import type {
    CertificateHolder,
    CertificateHolderPage,
    EventCertificate,
} from '@/types/certificates';
import type { DirectoryOption } from '@/types/monitoring';

type Filters = { search?: string; region?: string; hei?: string };

function people(count: number): string {
    return count === 1 ? '1 person' : `${formatCount(count)} people`;
}

/**
 * An event's certificate (docs/certificates.md): release it to everyone
 * checked in, again to those checked in since, update what released
 * certificates print, and see, download or withdraw each one given.
 */
export default function EventCertificatePage({
    certificate,
    awaiting,
    holders,
    filters,
    regions,
    heis,
}: {
    certificate: EventCertificate;
    awaiting: number;
    holders: CertificateHolderPage;
    filters: Filters;
    regions: DirectoryOption[];
    heis: DirectoryOption[];
}) {
    const { errors } = usePage().props;
    const problem = (errors as Partial<Record<string, string>>).certificate;
    const { values, loading, filtered, apply, change, search, pick } =
        useRecordFilters<Filters>(show.url(certificate.id), filters);
    const event = certificate.event;
    const released = certificate.released_at !== null;
    const eligible = certificate.eligible ?? 0;
    const issued = certificate.issued ?? 0;
    const withdrawn = certificate.withdrawn ?? 0;
    const title = certificate.title ?? 'Certificate';

    return (
        <>
            <Head title={`${title}: ${event?.title ?? 'GAD event'}`} />
            <div className="space-y-6">
                <Link
                    href={
                        certificate.design
                            ? design.url(certificate.design.id)
                            : designs.url()
                    }
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronLeft aria-hidden className="size-4" />
                    {certificate.design?.name ?? 'Certificates'}
                </Link>

                <header className="space-y-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {title}
                        <ReleaseBadge use={certificate} />
                    </p>
                    <h1 className="text-xl font-medium text-pretty">
                        {event?.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {event &&
                            certificateDates(event.starts_at, event.ends_at)}
                        {event?.location && ` · ${event.location}`}
                        {' · '}
                        {event?.region ?? 'Every region'}
                    </p>
                </header>

                {problem && (
                    <p
                        role="alert"
                        className={cn(
                            'rounded-lg px-4 py-3 text-sm',
                            tones.danger.badge,
                        )}
                    >
                        {problem}
                    </p>
                )}

                <section
                    aria-label="Release"
                    className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
                >
                    {released ? (
                        <>
                            <p className="text-sm text-pretty">
                                Released{' '}
                                {localDay(certificate.released_at ?? '')}
                                {certificate.released_by &&
                                    ` by ${certificate.released_by}`}
                                . Each person was notified and downloads theirs
                                from My certificates.
                            </p>
                            <dl className="grid grid-cols-3 gap-3 text-center sm:max-w-md">
                                {[
                                    ['Checked in', eligible],
                                    ['Given', issued],
                                    ['Withdrawn', withdrawn],
                                ].map(([label, count]) => (
                                    <div
                                        key={label}
                                        className="rounded-lg bg-muted px-3 py-2"
                                    >
                                        <dt className="text-xs text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="text-lg font-medium tabular-nums">
                                            {formatCount(Number(count))}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="flex flex-wrap gap-2">
                                {awaiting > 0 && (
                                    <ConfirmPopover
                                        title={`Release to ${people(awaiting)} more?`}
                                        description="They were checked in after the release. Each is notified."
                                        confirmLabel="Release"
                                        onConfirm={(visit) =>
                                            router.post(
                                                release.url(certificate.id),
                                                {},
                                                {
                                                    preserveScroll: true,
                                                    ...visit,
                                                },
                                            )
                                        }
                                    >
                                        <Button>
                                            <Send />
                                            Release to {people(awaiting)} more
                                        </Button>
                                    </ConfirmPopover>
                                )}
                                <ConfirmPopover
                                    title="Update released certificates?"
                                    description={`All ${people(issued)} will print the design, signatories and event as they are now, and their holders' names as their accounts have them. Use it for corrections.`}
                                    confirmLabel="Update"
                                    onConfirm={(visit) =>
                                        router.post(
                                            refresh.url(certificate.id),
                                            {},
                                            {
                                                preserveScroll: true,
                                                ...visit,
                                            },
                                        )
                                    }
                                >
                                    <Button variant="outline">
                                        <RefreshCw />
                                        Update released certificates
                                    </Button>
                                </ConfirmPopover>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-pretty">
                                {eligible > 0
                                    ? `${people(eligible)} checked in will get this certificate. Release it once the attendance is right; it keeps the design as it is then.`
                                    : 'No one is checked in yet. Release it once people are checked in at the event.'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <ConfirmPopover
                                    title={`Release to ${people(eligible)}?`}
                                    description="Each is notified and can download it from My certificates. People checked in later can be given it after."
                                    confirmLabel="Release"
                                    confirmDisabled={eligible === 0}
                                    onConfirm={(visit) =>
                                        router.post(
                                            release.url(certificate.id),
                                            {},
                                            {
                                                preserveScroll: true,
                                                ...visit,
                                            },
                                        )
                                    }
                                >
                                    <Button disabled={eligible === 0}>
                                        <Send />
                                        Release certificates
                                    </Button>
                                </ConfirmPopover>
                                <ConfirmPopover
                                    title="Remove it from this event?"
                                    description="The design stays in your list. You can use it on the event again."
                                    confirmLabel="Remove"
                                    onConfirm={(visit) =>
                                        router.delete(
                                            destroy.url(certificate.id),
                                            visit,
                                        )
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 />
                                        Remove from event
                                    </Button>
                                </ConfirmPopover>
                            </div>
                        </>
                    )}
                </section>

                {released && (
                    <>
                        <div className="@container overflow-hidden rounded-xl border bg-card">
                            <FilterBar
                                label="Filter people given it"
                                filters={placeFilterCount(regions)}
                            >
                                <SearchFilter
                                    value={values.search ?? ''}
                                    placeholder="Name or number"
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
                                {people(holders.meta.total)}
                            </h2>
                            {holders.data.length > 0 ? (
                                <ul className="divide-y">
                                    {holders.data.map((holder) => (
                                        <HolderItem
                                            key={holder.id}
                                            certificate={certificate}
                                            holder={holder}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <EmptyList
                                    filtered={filtered}
                                    title={
                                        filtered
                                            ? 'No one matches these filters'
                                            : 'No one has it yet'
                                    }
                                    text={
                                        filtered
                                            ? 'Try another name, or clear the filters.'
                                            : 'Release it to the people checked in.'
                                    }
                                    onClear={() => change({})}
                                />
                            )}
                            {holders.data.length > 0 && (
                                <Pagination
                                    page={holders.meta}
                                    label="people"
                                    className="sm:px-5"
                                />
                            )}
                        </section>
                    </>
                )}
            </div>
        </>
    );
}

function HolderItem({
    certificate,
    holder,
}: {
    certificate: EventCertificate;
    holder: CertificateHolder;
}) {
    const withdrawn = holder.withdrawn_at !== null;

    return (
        <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
            <div className={cn('min-w-0 flex-1', withdrawn && 'opacity-70')}>
                <p className="flex flex-wrap items-center gap-2 font-medium">
                    {holder.name}
                    {withdrawn && (
                        <span
                            className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                tones.warning.badge,
                            )}
                        >
                            Withdrawn
                        </span>
                    )}
                </p>
                <p className="text-[13px] text-muted-foreground">
                    {[holder.affiliation, holder.region]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
                <p className="text-[13px] text-muted-foreground tabular-nums">
                    No. {holder.number}
                    {withdrawn &&
                        holder.withdrawn_at &&
                        ` · Withdrawn ${localDay(holder.withdrawn_at)}${holder.withdrawn_by ? ` by ${holder.withdrawn_by}` : ''}`}
                </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1">
                {!withdrawn && (
                    <DownloadCertificateButton
                        id={holder.id}
                        label={`Download the certificate of ${holder.name}`}
                        compact
                    />
                )}
                <ConfirmPopover
                    title={
                        withdrawn
                            ? `Restore ${holder.number}?`
                            : `Withdraw ${holder.number}?`
                    }
                    description={
                        withdrawn
                            ? `${holder.name} gets it back in My certificates, and its verify page says it stands.`
                            : `For a certificate given by mistake. It leaves ${holder.name}'s certificates, and its verify page says it was withdrawn.`
                    }
                    confirmLabel={withdrawn ? 'Restore' : 'Withdraw'}
                    onConfirm={(visit) =>
                        router.put(
                            status.url([certificate.id, holder.id]),
                            { withdrawn: !withdrawn },
                            { preserveScroll: true, ...visit },
                        )
                    }
                >
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            'min-h-10',
                            !withdrawn &&
                                'text-muted-foreground hover:text-destructive',
                        )}
                    >
                        {withdrawn ? <Undo2 /> : <Trash2 />}
                        {withdrawn ? 'Restore' : 'Withdraw'}
                        <span className="sr-only">
                            {' '}
                            the certificate of {holder.name}
                        </span>
                    </Button>
                </ConfirmPopover>
            </div>
        </li>
    );
}
