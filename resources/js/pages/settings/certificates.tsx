import { Head, Link, router } from '@inertiajs/react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BackgroundThumbnail } from '@/components/certificates/background-thumbnail';
import { ConfirmPopover } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { selectClass } from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import {
    EmptyList,
    Filter,
    FilterBar,
    NoOfficeNotice,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { cn } from '@/lib/utils';
import {
    create,
    destroy,
    duplicate,
    index,
    show,
} from '@/routes/settings/certificates';
import type {
    CertificateDesign,
    CertificateDesignPage,
} from '@/types/certificates';
import type { DirectoryOption } from '@/types/monitoring';

type Filters = { search?: string; region?: string };

/**
 * Settings → Certificates: an office's certificate designs, to use on its
 * GAD events (docs/certificates.md).
 */
export default function Certificates({
    designs,
    filters,
    regions,
    nationalAccess,
    hasOffice,
    permissions,
}: {
    designs: CertificateDesignPage;
    filters: Filters;
    regions: DirectoryOption[];
    nationalAccess: boolean;
    hasOffice: boolean;
    permissions: { create: boolean };
}) {
    const { values, loading, filtered, apply, change, search } =
        useRecordFilters<Filters>(index.url(), filters);

    return (
        <>
            <Head title="Certificates" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl min-w-0">
                        <Heading
                            variant="small"
                            title="Certificates"
                            description="Design your office's certificates, use them on GAD events, then release them to everyone checked in. People download theirs from My certificates."
                        />
                    </div>
                    {permissions.create && (
                        <Button asChild className="shrink-0">
                            <Link href={create.url()}>
                                <Plus />
                                New certificate
                            </Link>
                        </Button>
                    )}
                </div>

                {!hasOffice && <NoOfficeNotice noun="certificates" />}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter certificates"
                        filters={nationalAccess ? 1 : 0}
                        className="border-b-0"
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Certificate name"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                        {nationalAccess && (
                            <Filter label="Office" id="region">
                                <FormSelect
                                    id="region"
                                    className={selectClass}
                                    value={values.region ?? ''}
                                    onChange={(region) =>
                                        change({ ...values, region })
                                    }
                                    placeholder="All offices"
                                    allowEmpty
                                    emptyLabel="All offices"
                                    options={regions.map((region) => ({
                                        value: String(region.id),
                                        label: region.name,
                                    }))}
                                />
                            </Filter>
                        )}
                    </FilterBar>
                </div>

                <section
                    aria-label="Certificates"
                    aria-busy={loading}
                    className={cn(
                        'overflow-hidden rounded-xl border bg-card transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    {designs.data.length > 0 ? (
                        <ul className="divide-y">
                            {designs.data.map((design) => (
                                <DesignItem
                                    key={design.id}
                                    design={design}
                                    canCreate={permissions.create}
                                />
                            ))}
                        </ul>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'No certificates match these filters'
                                    : 'No certificates yet'
                            }
                            text={
                                filtered
                                    ? 'Try another name, or clear the filters.'
                                    : 'Add your signatories first, then make a certificate to use on your events.'
                            }
                            onClear={() => change({})}
                        />
                    )}
                    {designs.data.length > 0 && (
                        <Pagination
                            page={designs.meta}
                            label="certificates"
                            className="sm:px-5"
                        />
                    )}
                </section>
            </div>
        </>
    );
}

function DesignItem({
    design,
    canCreate,
}: {
    design: CertificateDesign;
    canCreate: boolean;
}) {
    const [copying, setCopying] = useState(false);
    const uses = design.uses ?? 0;
    const released = design.released_uses ?? 0;
    const signatories = design.signatories ?? [];

    return (
        <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
            <div className="flex min-w-0 flex-1 gap-4">
                <BackgroundThumbnail
                    background={design.background}
                    className="w-24 shrink-0 self-start"
                />
                <div className="min-w-0">
                    <Link
                        href={show.url(design.id)}
                        className="font-medium underline-offset-2 hover:underline"
                    >
                        {design.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {design.title}
                        {' · '}
                        {design.region?.name ?? 'CHED Central Office'}
                    </p>
                    <p className="mt-1 text-[13px] text-pretty text-muted-foreground">
                        {signatories.length > 0
                            ? `Signed by ${signatories.map((signatory) => signatory.name).join(', ')}`
                            : 'No signatory yet'}
                        {' · '}
                        <span className="tabular-nums">
                            {uses === 1
                                ? 'Used on 1 event'
                                : `Used on ${uses} events`}
                        </span>
                    </p>
                </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 pl-28 sm:pl-0">
                {canCreate && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-11"
                        disabled={copying}
                        onClick={() =>
                            router.post(
                                duplicate.url(design.id),
                                {},
                                {
                                    onStart: () => setCopying(true),
                                    onFinish: () => setCopying(false),
                                },
                            )
                        }
                    >
                        <Copy />
                        <span className="sr-only">Duplicate {design.name}</span>
                    </Button>
                )}
                {design.can.delete && (
                    <ConfirmPopover
                        title={`Delete ${design.name}?`}
                        description={
                            released > 0
                                ? 'Certificates were released with it, so it stays. Duplicate it to make a new one.'
                                : uses > 0
                                  ? 'It comes off the events it waits on.'
                                  : 'It is used on no event yet.'
                        }
                        confirmLabel="Delete"
                        confirmDisabled={released > 0}
                        onConfirm={(visit) =>
                            router.delete(destroy.url(design.id), {
                                preserveScroll: true,
                                ...visit,
                            })
                        }
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-11 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 />
                            <span className="sr-only">
                                Delete {design.name}
                            </span>
                        </Button>
                    </ConfirmPopover>
                )}
            </div>
        </li>
    );
}
