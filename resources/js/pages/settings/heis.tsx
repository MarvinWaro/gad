import { Head, router, useForm } from '@inertiajs/react';
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { Pagination, type Paginated } from '@/components/pagination';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/form-select';
import { Label } from '@/components/ui/label';
import { selectClass } from '@/components/monitoring/shared';
import {
    EmptyList,
    Filter,
    FilterBar,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { UNASSIGNED_CLUSTER } from '@/lib/places';
import { cn } from '@/lib/utils';

type Region = { id: number; name: string };
type Cluster = {
    id: number;
    name: string;
    survey_region_id: number;
    region: { id: number; name: string };
};
type Hei = {
    id: number;
    uii: string | null;
    name: string;
    ownership: 'public' | 'private' | null;
    is_active: boolean;
    portal_synced_at: string | null;
    survey_cluster_id: number;
    cluster: { id: number; name: string; region: { id: number; name: string } };
};
type Permissions = { create: boolean; update: boolean; delete: boolean };
type HeiFilters = {
    search: string;
    region: string;
    cluster: string;
    status: string;
    ownership: string;
};

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const ownershipOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'none', label: 'Not set' },
];

export default function Heis({
    regions,
    clusters,
    heis,
    filters,
    clusterOptions,
    permissions,
}: {
    regions: Region[];
    clusters: Cluster[];
    heis: Paginated<Hei>;
    filters: HeiFilters;
    /** The chosen region's clusters, when there are two or more to pick. */
    clusterOptions: Region[];
    permissions: Permissions;
}) {
    const { values, loading, filtered, apply, change, search } =
        useRecordFilters('/settings/heis', filters);
    // Region, status and ownership, plus the cluster when offered; the search
    // takes its own row on phones.
    const filterCount = 3 + (clusterOptions.length > 0 ? 1 : 0);

    return (
        <>
            <Head title="HEIs" />
            <div className="space-y-6">
                <div className="flex justify-between gap-4">
                    <Heading
                        variant="small"
                        title="HEIs"
                        description="The higher education institutions respondents choose from, grouped by the cluster they sit in."
                    />
                    {permissions.create && (
                        <HeiDialog regions={regions} clusters={clusters} />
                    )}
                </div>
                <div className="@container overflow-hidden rounded-xl border bg-card">
                    <FilterBar label="Filter HEIs" filters={filterCount}>
                        <SearchFilter
                            value={values.search}
                            placeholder="Name or UII"
                            onSearch={search}
                            onSubmit={() => apply(values)}
                        />
                        <Filter label="Region" id="region">
                            <FormSelect
                                id="region"
                                className={selectClass}
                                value={values.region}
                                onChange={(value) =>
                                    change({
                                        ...values,
                                        region: value,
                                        cluster: '',
                                    })
                                }
                                placeholder="All regions"
                                allowEmpty
                                options={regions.map((region) => ({
                                    value: String(region.id),
                                    label: region.name,
                                }))}
                            />
                        </Filter>
                        {clusterOptions.length > 0 && (
                            <Filter label="Cluster" id="cluster">
                                <FormSelect
                                    id="cluster"
                                    className={selectClass}
                                    value={values.cluster}
                                    onChange={(value) =>
                                        change({ ...values, cluster: value })
                                    }
                                    placeholder="All clusters"
                                    allowEmpty
                                    options={clusterOptions.map((cluster) => ({
                                        value: String(cluster.id),
                                        label: cluster.name,
                                    }))}
                                />
                            </Filter>
                        )}
                        <Filter label="Status" id="status">
                            <FormSelect
                                id="status"
                                className={selectClass}
                                value={values.status}
                                onChange={(value) =>
                                    change({ ...values, status: value })
                                }
                                placeholder="Active and inactive"
                                allowEmpty
                                options={statusOptions}
                            />
                        </Filter>
                        <Filter label="Ownership" id="ownership">
                            <FormSelect
                                id="ownership"
                                className={selectClass}
                                value={values.ownership}
                                onChange={(value) =>
                                    change({ ...values, ownership: value })
                                }
                                placeholder="Any ownership"
                                allowEmpty
                                options={ownershipOptions}
                            />
                        </Filter>
                    </FilterBar>
                    {heis.total === 0 && filtered ? (
                        <EmptyList
                            filtered
                            title="No HEIs match these filters"
                            text="Try another name, region, status or ownership, or clear the filters to see every institution."
                            onClear={() =>
                                change({
                                    search: '',
                                    region: '',
                                    cluster: '',
                                    status: '',
                                    ownership: '',
                                })
                            }
                        />
                    ) : heis.total === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <GraduationCap className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                No HEIs configured
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Add institutions here so respondents can pick
                                theirs. A survey cannot be published until at
                                least one HEI is active.
                            </p>
                        </div>
                    ) : (
                        <div
                            aria-busy={loading}
                            className={cn(
                                'transition-opacity',
                                loading && 'opacity-60',
                            )}
                        >
                            <HeiTable
                                heis={heis.data}
                                regions={regions}
                                clusters={clusters}
                                permissions={permissions}
                            />
                            <Pagination page={heis} label="institutions" />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const OWNERSHIP_LABEL = { public: 'Public', private: 'Private' } as const;

function HeiTable({
    heis,
    regions,
    clusters,
    permissions,
}: {
    heis: Hei[];
    regions: Region[];
    clusters: Cluster[];
    permissions: Permissions;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs">
                    <tr>
                        <th className="px-4 py-3">UII</th>
                        <th className="px-4 py-3">HEI name</th>
                        <th className="px-4 py-3">Region</th>
                        <th className="px-4 py-3">Ownership</th>
                        <th className="sticky right-0 bg-muted/50 px-4 py-3 text-right shadow-[inset_1px_0_0_var(--border)]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {heis.map((hei) => (
                        <tr key={hei.id}>
                            <td className="px-4 py-4 font-mono text-xs">
                                {hei.uii ?? (
                                    <span className="text-muted-foreground">
                                        Not set
                                    </span>
                                )}
                            </td>
                            <td className="px-4 py-4">
                                <span className="font-medium">{hei.name}</span>
                                {!hei.is_active && (
                                    <Badge
                                        variant="outline"
                                        className="ml-2 align-middle text-muted-foreground"
                                    >
                                        Inactive
                                    </Badge>
                                )}
                            </td>
                            <td className="px-4 py-4">
                                <p>{hei.cluster.region.name}</p>
                                {/* The holding cluster is not a place. */}
                                {hei.cluster.name !== UNASSIGNED_CLUSTER && (
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {hei.cluster.name}
                                    </p>
                                )}
                            </td>
                            <td className="px-4 py-4">
                                {hei.ownership ? (
                                    <Badge variant="outline">
                                        {OWNERSHIP_LABEL[hei.ownership]}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">
                                        Not set
                                    </span>
                                )}
                            </td>
                            <td className="sticky right-0 bg-card px-4 py-4 shadow-[inset_1px_0_0_var(--border)]">
                                <div className="flex justify-end gap-1">
                                    {permissions.update && (
                                        <>
                                            <HeiDialog
                                                hei={hei}
                                                regions={regions}
                                                clusters={clusters}
                                            />
                                            {hei.is_active ? (
                                                <ConfirmPopover
                                                    title={`Deactivate ${hei.name}?`}
                                                    description="It will be hidden from the public surveys and registration. Its responses and accounts are kept, and you can activate it again anytime."
                                                    confirmLabel="Deactivate"
                                                    onConfirm={(visit) =>
                                                        toggleActive(hei, visit)
                                                    }
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        Deactivate
                                                    </Button>
                                                </ConfirmPopover>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        toggleActive(hei)
                                                    }
                                                >
                                                    Activate
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    {permissions.delete && (
                                        <ConfirmPopover
                                            title={`Delete ${hei.name}?`}
                                            description="Institutions with responses cannot be deleted. Deactivate them instead."
                                            confirmLabel="Delete"
                                            onConfirm={(visit) =>
                                                router.delete(
                                                    `/settings/survey-directories/heis/${hei.id}`,
                                                    {
                                                        preserveScroll: true,
                                                        ...visit,
                                                    },
                                                )
                                            }
                                        >
                                            <IconAction
                                                label="Delete this institution"
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 />
                                            </IconAction>
                                        </ConfirmPopover>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function toggleActive(hei: Hei, visit?: ConfirmVisit) {
    router.put(
        `/settings/survey-directories/heis/${hei.id}`,
        {
            uii: hei.uii,
            name: hei.name,
            ownership: hei.ownership,
            survey_cluster_id: hei.survey_cluster_id,
            is_active: !hei.is_active,
        },
        { preserveScroll: true, ...visit },
    );
}

function HeiDialog({
    hei,
    regions,
    clusters,
}: {
    hei?: Hei;
    regions: Region[];
    clusters: Cluster[];
}) {
    const [open, setOpen] = useState(false);
    const editing = hei !== undefined;
    const form = useForm({
        uii: hei?.uii ?? '',
        name: hei?.name ?? '',
        survey_region_id: String(hei?.cluster.region.id ?? ''),
        survey_cluster_id: String(hei?.survey_cluster_id ?? ''),
        ownership: hei?.ownership ?? '',
        is_active: hei?.is_active ?? true,
    });
    // The public survey filters HEIs by cluster, so the cluster has to belong
    // to the chosen region or the institution would never be selectable.
    const available = clusters.filter(
        (cluster) => String(cluster.region.id) === form.data.survey_region_id,
    );

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                if (!editing) {
                    form.reset();
                }
            },
        };
        if (editing) {
            form.put(`/settings/survey-directories/heis/${hei.id}`, options);
        } else {
            form.post('/settings/survey-directories/heis', options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {editing ? (
                    <IconAction label={`Edit ${hei.name}`}>
                        <Pencil />
                    </IconAction>
                ) : (
                    <Button>
                        <Plus />
                        Add HEI
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editing ? `Edit ${hei.name}` : 'Add HEI'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="hei-uii">UII</Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                            CHED&rsquo;s Unique Institutional Identifier.
                            Letters, numbers, and dashes.
                        </p>
                        <Input
                            id="hei-uii"
                            className="mt-1.5 font-mono text-xs"
                            placeholder="e.g. 12001"
                            value={form.data.uii}
                            onChange={(event) =>
                                form.setData('uii', event.target.value)
                            }
                        />
                        <InputError message={form.errors.uii} />
                    </div>
                    <div>
                        <Label htmlFor="hei-name">HEI name</Label>
                        <Input
                            id="hei-name"
                            className="mt-1.5"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="hei-region">Region</Label>
                            <FormSelect
                                id="hei-region"
                                className="mt-1.5"
                                value={form.data.survey_region_id}
                                onChange={(value) =>
                                    form.setData((data) => ({
                                        ...data,
                                        survey_region_id: value,
                                        survey_cluster_id: '',
                                    }))
                                }
                                placeholder="Select region"
                                options={regions.map((region) => ({
                                    value: String(region.id),
                                    label: region.name,
                                }))}
                                allowEmpty
                            />
                        </div>
                        <div>
                            <Label htmlFor="hei-cluster">Cluster</Label>
                            <FormSelect
                                id="hei-cluster"
                                className="mt-1.5"
                                value={form.data.survey_cluster_id}
                                disabled={
                                    !form.data.survey_region_id ||
                                    available.length === 0
                                }
                                onChange={(value) =>
                                    form.setData('survey_cluster_id', value)
                                }
                                placeholder={
                                    form.data.survey_region_id &&
                                    available.length === 0
                                        ? 'No clusters in this region'
                                        : 'Select cluster'
                                }
                                options={available.map((cluster) => ({
                                    value: String(cluster.id),
                                    label: cluster.name,
                                }))}
                                allowEmpty
                            />
                            <InputError
                                message={form.errors.survey_cluster_id}
                            />
                        </div>
                    </div>
                    <p className="-mt-1 text-xs text-muted-foreground">
                        Respondents pick the region, then the HEI. Once a
                        region&rsquo;s institutions sit in two or more clusters,
                        they pick the cluster in between.
                    </p>
                    <div>
                        <Label htmlFor="hei-ownership">Ownership</Label>
                        <FormSelect
                            id="hei-ownership"
                            className="mt-1.5"
                            value={form.data.ownership}
                            onChange={(value) =>
                                form.setData(
                                    'ownership',
                                    value as Hei['ownership'] & string,
                                )
                            }
                            placeholder="Not set"
                            options={[
                                { value: 'public', label: 'Public' },
                                { value: 'private', label: 'Private' },
                            ]}
                            allowEmpty
                        />
                        <InputError message={form.errors.ownership} />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>
                            {editing ? 'Save changes' : 'Add HEI'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
