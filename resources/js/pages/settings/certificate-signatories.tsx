import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
    SignatoryDialog,
    SignatureTile,
} from '@/components/certificates/signatory-dialog';
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
import { destroy, index } from '@/routes/settings/certificate-signatories';
import type { SignatoryPage } from '@/types/certificates';
import type { DirectoryOption } from '@/types/monitoring';

type Filters = { search?: string; region?: string };

/**
 * Settings → Signatories: who signs an office's event certificates, with
 * their e-signatures (docs/certificates.md).
 */
export default function CertificateSignatories({
    signatories,
    filters,
    regions,
    nationalAccess,
    hasOffice,
    permissions,
}: {
    signatories: SignatoryPage;
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
            <Head title="Signatories" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="max-w-2xl min-w-0">
                        <Heading
                            variant="small"
                            title="Signatories"
                            description="The people who sign your office's event certificates. Upload an e-signature only with the signatory's consent; it is kept private and printed only on certificates."
                        />
                    </div>
                    {permissions.create && (
                        <SignatoryDialog
                            signatory={null}
                            regions={regions}
                            nationalAccess={nationalAccess}
                        >
                            <Button className="shrink-0">
                                <Plus />
                                Add signatory
                            </Button>
                        </SignatoryDialog>
                    )}
                </div>

                {!hasOffice && <NoOfficeNotice noun="signatories" />}

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar
                        label="Filter signatories"
                        filters={nationalAccess ? 1 : 0}
                        className="border-b-0"
                    >
                        <SearchFilter
                            value={values.search ?? ''}
                            placeholder="Name or position"
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
                    aria-label="Signatories"
                    aria-busy={loading}
                    className={cn(
                        'overflow-hidden rounded-xl border bg-card transition-opacity',
                        loading && 'opacity-60',
                    )}
                >
                    {signatories.data.length > 0 ? (
                        <ul className="divide-y">
                            {signatories.data.map((signatory) => {
                                const designs = signatory.designs ?? 0;

                                return (
                                    <li
                                        key={signatory.id}
                                        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-4">
                                            <SignatureTile
                                                src={signatory.signature}
                                                name={signatory.name}
                                                className="h-14 w-28 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-medium">
                                                    {signatory.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {signatory.position}
                                                </p>
                                                <p className="mt-1 text-[13px] text-muted-foreground">
                                                    {signatory.region?.name ??
                                                        'CHED Central Office'}
                                                    {' · '}
                                                    <span className="tabular-nums">
                                                        {designs === 1
                                                            ? 'Signs 1 design'
                                                            : `Signs ${designs} designs`}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        {(signatory.can.update ||
                                            signatory.can.delete) && (
                                            <div className="flex shrink-0 items-center gap-1 pl-32 sm:pl-0">
                                                {signatory.can.update && (
                                                    <SignatoryDialog
                                                        signatory={signatory}
                                                        regions={regions}
                                                        nationalAccess={
                                                            nationalAccess
                                                        }
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-11"
                                                        >
                                                            <Pencil />
                                                            <span className="sr-only">
                                                                Edit{' '}
                                                                {signatory.name}
                                                            </span>
                                                        </Button>
                                                    </SignatoryDialog>
                                                )}
                                                {signatory.can.delete && (
                                                    <ConfirmPopover
                                                        title={`Remove ${signatory.name}?`}
                                                        description={
                                                            designs > 0
                                                                ? `They sign ${designs === 1 ? 'a certificate design' : `${designs} certificate designs`}. Take them off ${designs === 1 ? 'it' : 'those'} first.`
                                                                : 'Certificates already released keep their signature.'
                                                        }
                                                        confirmLabel="Remove"
                                                        confirmDisabled={
                                                            designs > 0
                                                        }
                                                        onConfirm={(visit) =>
                                                            router.delete(
                                                                destroy.url(
                                                                    signatory.id,
                                                                ),
                                                                {
                                                                    preserveScroll: true,
                                                                    ...visit,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-11 text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 />
                                                            <span className="sr-only">
                                                                Remove{' '}
                                                                {signatory.name}
                                                            </span>
                                                        </Button>
                                                    </ConfirmPopover>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <EmptyList
                            filtered={filtered}
                            title={
                                filtered
                                    ? 'No signatories match these filters'
                                    : 'No signatories yet'
                            }
                            text={
                                filtered
                                    ? 'Try another name, or clear the filters.'
                                    : 'Add the people who sign your certificates, with their e-signatures.'
                            }
                            onClear={() => change({})}
                        />
                    )}
                    {signatories.data.length > 0 && (
                        <Pagination
                            page={signatories.meta}
                            label="signatories"
                            className="sm:px-5"
                        />
                    )}
                </section>
            </div>
        </>
    );
}
