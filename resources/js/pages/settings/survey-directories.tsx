import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import Heading from '@/components/heading';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Region = {
    id: number;
    name: string;
    is_active: boolean;
    clusters_count: number;
};
type Cluster = {
    id: number;
    name: string;
    is_active: boolean;
    survey_region_id: number;
    region: { id: number; name: string };
    heis_count: number;
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
type RespondentGroup = {
    id: number;
    value: string;
    label: string;
    requires_text: boolean;
    is_active: boolean;
    sort_order: number;
};
type Permissions = { create: boolean; update: boolean; delete: boolean };
type Portal = {
    configured: boolean;
    last_synced_at: string | null;
    synced_count: number;
};

export default function SurveyDirectories({
    regions,
    clusters,
    heis,
    respondentGroups,
    permissions,
    portal,
}: {
    regions: Region[];
    clusters: Cluster[];
    heis: Hei[];
    respondentGroups: RespondentGroup[];
    permissions: Permissions;
    portal: Portal;
}) {
    const [tab, setTab] = useState<
        'regions' | 'clusters' | 'heis' | 'respondent-groups'
    >('regions');
    // HEIs and respondent groups render in their own tables; only these three
    // share the generic one, so keep them off the union it is typed against.
    const rows: Array<Region | Cluster | Hei> =
        tab === 'regions' ? regions : tab === 'clusters' ? clusters : heis;
    const currentCount =
        tab === 'regions'
            ? regions.length
            : tab === 'clusters'
              ? clusters.length
              : tab === 'heis'
                ? heis.length
                : respondentGroups.length;
    return (
        <>
            <Head title="Survey directories" />
            <div className="space-y-6">
                <div className="flex justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Survey directories"
                        description="Maintain the Region, Cluster, and HEI choices used by public surveys."
                    />
                    {permissions.create &&
                        (tab === 'respondent-groups' ? (
                            <RespondentGroupDialog />
                        ) : tab === 'heis' ? (
                            <HeiDialog regions={regions} clusters={clusters} />
                        ) : (
                            <CreateDirectoryDialog
                                type={tab}
                                regions={regions}
                                clusters={clusters}
                            />
                        ))}
                </div>
                {permissions.create && <PortalSyncPanel portal={portal} />}
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                    {(
                        [
                            'regions',
                            'clusters',
                            'heis',
                            'respondent-groups',
                        ] as const
                    ).map((item) => (
                        <Button
                            key={item}
                            variant={tab === item ? 'secondary' : 'ghost'}
                            className="flex-1 capitalize"
                            onClick={() => setTab(item)}
                        >
                            {item === 'heis'
                                ? 'HEIs'
                                : item === 'respondent-groups'
                                  ? 'Groups'
                                  : item}
                        </Button>
                    ))}
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                    {tab === 'respondent-groups' &&
                    respondentGroups.length > 0 ? (
                        <RespondentGroupTable
                            groups={respondentGroups}
                            permissions={permissions}
                        />
                    ) : tab === 'heis' && heis.length > 0 ? (
                        <HeiTable
                            heis={heis}
                            regions={regions}
                            clusters={clusters}
                            permissions={permissions}
                        />
                    ) : currentCount === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <Building2 className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                No{' '}
                                {tab === 'heis'
                                    ? 'HEIs'
                                    : tab === 'respondent-groups'
                                      ? 'respondent groups'
                                      : tab}{' '}
                                configured
                            </h2>
                            {tab === 'heis' && (
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    Add institutions here so respondents can
                                    pick theirs. A survey cannot be published
                                    until at least one HEI is active.
                                </p>
                            )}
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-xs">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Parent</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-5 py-4 font-medium">
                                            {row.name}
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {'region' in row
                                                ? row.region.name
                                                : 'cluster' in row
                                                  ? `${row.cluster.region.name} · ${row.cluster.name}`
                                                  : '—'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <Badge
                                                variant={
                                                    row.is_active
                                                        ? 'secondary'
                                                        : 'outline'
                                                }
                                            >
                                                {row.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                {permissions.update && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.put(
                                                                `/settings/survey-directories/${tab}/${row.id}`,
                                                                {
                                                                    name: row.name,
                                                                    is_active:
                                                                        !row.is_active,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {row.is_active
                                                            ? 'Deactivate'
                                                            : 'Activate'}
                                                    </Button>
                                                )}
                                                {permissions.delete && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            confirm(
                                                                `Delete ${row.name}?`,
                                                            ) &&
                                                            router.delete(
                                                                `/settings/survey-directories/${tab}/${row.id}`,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 />
                                                        <span className="sr-only">
                                                            Delete {row.name}
                                                        </span>
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

function CreateDirectoryDialog({
    type,
    regions,
    clusters,
}: {
    type: 'regions' | 'clusters' | 'heis';
    regions: Region[];
    clusters: Cluster[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        survey_region_id: '',
        survey_cluster_id: '',
    });
    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/settings/survey-directories/${type}`, {
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus />
                    Add {type === 'heis' ? 'HEI' : type.slice(0, -1)}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add {type === 'heis' ? 'HEI' : type.slice(0, -1)}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label>Name</Label>
                        <Input
                            className="mt-1"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    {type === 'clusters' && (
                        <div>
                            <Label>Region</Label>
                            <select
                                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                value={form.data.survey_region_id}
                                onChange={(e) =>
                                    form.setData(
                                        'survey_region_id',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Select region</option>
                                {regions.map((r) => (
                                    <option value={r.id} key={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={form.errors.survey_region_id}
                            />
                        </div>
                    )}
                    {type === 'heis' && (
                        <div>
                            <Label>Cluster</Label>
                            <select
                                className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                value={form.data.survey_cluster_id}
                                onChange={(e) =>
                                    form.setData(
                                        'survey_cluster_id',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">Select cluster</option>
                                {clusters.map((c) => (
                                    <option value={c.id} key={c.id}>
                                        {c.region.name} · {c.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={form.errors.survey_cluster_id}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>Add</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PortalSyncPanel({ portal }: { portal: Portal }) {
    const form = useForm({});
    const syncedAt = portal.last_synced_at
        ? new Date(portal.last_synced_at).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : null;

    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h2 className="text-sm font-medium">CHED portal</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {!portal.configured
                            ? 'Set PORTAL_API and PORTAL_BASE_URL in the environment to pull the HEI list automatically.'
                            : syncedAt
                              ? `${portal.synced_count} institutions synced. Last checked ${syncedAt}.`
                              : 'Not synced yet. Pull the institution list to fill the HEI directory.'}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className="sm:shrink-0"
                    disabled={!portal.configured || form.processing}
                    onClick={() =>
                        form.post('/settings/survey-directories/sync-heis', {
                            preserveScroll: true,
                        })
                    }
                >
                    <RefreshCw
                        className={form.processing ? 'animate-spin' : undefined}
                    />
                    {form.processing ? 'Syncing…' : 'Sync HEIs'}
                </Button>
            </div>
            <InputError
                className="mt-2"
                message={(form.errors as Record<string, string>).portal}
            />
            <p className="mt-2 text-xs text-muted-foreground">
                Institutions the portal no longer lists are deactivated, never
                deleted, so responses already collected stay intact.
            </p>
        </div>
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
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {hei.cluster.name}
                                </p>
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
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.put(
                                                        `/settings/survey-directories/heis/${hei.id}`,
                                                        {
                                                            uii: hei.uii,
                                                            name: hei.name,
                                                            ownership:
                                                                hei.ownership,
                                                            survey_cluster_id:
                                                                hei.survey_cluster_id,
                                                            is_active:
                                                                !hei.is_active,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                {hei.is_active
                                                    ? 'Deactivate'
                                                    : 'Activate'}
                                            </Button>
                                        </>
                                    )}
                                    {permissions.delete && (
                                        <IconAction
                                            label="Delete this institution"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                confirm(
                                                    `Delete ${hei.name}? Institutions with responses cannot be deleted — deactivate them instead.`,
                                                ) &&
                                                router.delete(
                                                    `/settings/survey-directories/heis/${hei.id}`,
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            <Trash2 />
                                        </IconAction>
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
                            <select
                                id="hei-region"
                                className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm"
                                value={form.data.survey_region_id}
                                onChange={(event) =>
                                    form.setData((data) => ({
                                        ...data,
                                        survey_region_id: event.target.value,
                                        survey_cluster_id: '',
                                    }))
                                }
                            >
                                <option value="">Select region</option>
                                {regions.map((region) => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label htmlFor="hei-cluster">Cluster</Label>
                            <select
                                id="hei-cluster"
                                className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                                value={form.data.survey_cluster_id}
                                disabled={
                                    !form.data.survey_region_id ||
                                    available.length === 0
                                }
                                onChange={(event) =>
                                    form.setData(
                                        'survey_cluster_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">
                                    {form.data.survey_region_id &&
                                    available.length === 0
                                        ? 'No clusters in this region'
                                        : 'Select cluster'}
                                </option>
                                {available.map((cluster) => (
                                    <option key={cluster.id} value={cluster.id}>
                                        {cluster.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={form.errors.survey_cluster_id}
                            />
                        </div>
                    </div>
                    <p className="-mt-1 text-xs text-muted-foreground">
                        Respondents narrow Region, then Cluster, then HEI, so an
                        institution needs both to be reachable.
                    </p>
                    <div>
                        <Label htmlFor="hei-ownership">Ownership</Label>
                        <select
                            id="hei-ownership"
                            className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm"
                            value={form.data.ownership}
                            onChange={(event) =>
                                form.setData(
                                    'ownership',
                                    event.target.value as Hei['ownership'] &
                                        string,
                                )
                            }
                        >
                            <option value="">Not set</option>
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                        </select>
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

function RespondentGroupTable({
    groups,
    permissions,
}: {
    groups: RespondentGroup[];
    permissions: Permissions;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Answer key</th>
                        <th className="px-4 py-3">Asks for detail</th>
                        <th className="sticky right-0 bg-muted/50 px-4 py-3 text-right shadow-[inset_1px_0_0_var(--border)]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {groups.map((group) => (
                        <tr key={group.id}>
                            <td className="px-4 py-4">
                                <span className="font-medium">
                                    {group.label}
                                </span>
                                {!group.is_active && (
                                    <Badge
                                        variant="outline"
                                        className="ml-2 align-middle text-muted-foreground"
                                    >
                                        Inactive
                                    </Badge>
                                )}
                            </td>
                            <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                                {group.value}
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">
                                {group.requires_text ? 'Yes' : 'No'}
                            </td>
                            <td className="sticky right-0 bg-card px-4 py-4 shadow-[inset_1px_0_0_var(--border)]">
                                <div className="flex justify-end gap-1">
                                    {permissions.update && (
                                        <>
                                            <RespondentGroupDialog
                                                group={group}
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    router.put(
                                                        `/settings/survey-directories/respondent-groups/${group.id}`,
                                                        {
                                                            label: group.label,
                                                            requires_text:
                                                                group.requires_text,
                                                            is_active:
                                                                !group.is_active,
                                                        },
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                {group.is_active
                                                    ? 'Deactivate'
                                                    : 'Activate'}
                                            </Button>
                                        </>
                                    )}
                                    {permissions.delete && (
                                        <IconAction
                                            label="Delete this group"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                confirm(
                                                    `Delete ${group.label}? Groups with collected responses cannot be deleted — deactivate them instead.`,
                                                ) &&
                                                router.delete(
                                                    `/settings/survey-directories/respondent-groups/${group.id}`,
                                                    { preserveScroll: true },
                                                )
                                            }
                                        >
                                            <Trash2 />
                                        </IconAction>
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

function RespondentGroupDialog({ group }: { group?: RespondentGroup }) {
    const [open, setOpen] = useState(false);
    const editing = group !== undefined;
    const form = useForm({
        label: group?.label ?? '',
        requires_text: group?.requires_text ?? false,
        is_active: group?.is_active ?? true,
    });

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
            form.put(
                `/settings/survey-directories/respondent-groups/${group.id}`,
                options,
            );
        } else {
            form.post(
                '/settings/survey-directories/respondent-groups',
                options,
            );
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {editing ? (
                    <IconAction label={`Edit ${group.label}`}>
                        <Pencil />
                    </IconAction>
                ) : (
                    <Button>
                        <Plus />
                        Add group
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? `Edit ${group.label}`
                            : 'Add respondent group'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="group-label">Name</Label>
                        <Input
                            id="group-label"
                            className="mt-1.5"
                            placeholder="e.g. Student"
                            value={form.data.label}
                            onChange={(event) =>
                                form.setData('label', event.target.value)
                            }
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {editing
                                ? `Stored with responses as ${group.value}, which never changes when you rename the group.`
                                : 'Shown to respondents on every survey.'}
                        </p>
                        <InputError message={form.errors.label} />
                    </div>
                    <Label
                        htmlFor="group-requires-text"
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-normal"
                    >
                        <Checkbox
                            id="group-requires-text"
                            checked={form.data.requires_text}
                            onCheckedChange={(checked) =>
                                form.setData('requires_text', checked === true)
                            }
                        />
                        Ask respondents to type their own answer
                    </Label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>
                            {editing ? 'Save changes' : 'Add group'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
