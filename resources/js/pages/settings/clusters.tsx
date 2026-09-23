import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import Heading from '@/components/heading';
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
import { Label } from '@/components/ui/label';

type Region = { id: number; name: string };
type Cluster = {
    id: number;
    name: string;
    is_active: boolean;
    survey_region_id: number;
    region: { id: number; name: string };
    heis_count: number;
};
type Permissions = { create: boolean; update: boolean; delete: boolean };

export default function Clusters({
    regions,
    clusters,
    permissions,
}: {
    regions: Region[];
    clusters: Cluster[];
    permissions: Permissions;
}) {
    return (
        <>
            <Head title="Clusters" />
            <div className="space-y-6">
                <div className="flex justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Clusters"
                        description="The provinces within a region. Respondents narrow to a cluster before choosing their institution."
                    />
                    {permissions.create && <ClusterDialog regions={regions} />}
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                    {clusters.length === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <Building2 className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                No clusters configured
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                A region with no clusters is withheld from the
                                public form when the questionnaire requires one.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-xs">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Region</th>
                                    <th className="px-5 py-3">HEIs</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {clusters.map((cluster) => (
                                    <tr key={cluster.id}>
                                        <td className="px-5 py-4">
                                            <span className="font-medium">
                                                {cluster.name}
                                            </span>
                                            {!cluster.is_active && (
                                                <Badge
                                                    variant="outline"
                                                    className="ml-2 align-middle text-muted-foreground"
                                                >
                                                    Inactive
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {cluster.region.name}
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {cluster.heis_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                {permissions.update && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.put(
                                                                `/settings/survey-directories/clusters/${cluster.id}`,
                                                                {
                                                                    name: cluster.name,
                                                                    is_active:
                                                                        !cluster.is_active,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {cluster.is_active
                                                            ? 'Deactivate'
                                                            : 'Activate'}
                                                    </Button>
                                                )}
                                                {permissions.delete && (
                                                    <IconAction
                                                        label="Delete this cluster"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() =>
                                                            confirm(
                                                                `Delete ${cluster.name}? Clusters with institutions cannot be deleted — deactivate them instead.`,
                                                            ) &&
                                                            router.delete(
                                                                `/settings/survey-directories/clusters/${cluster.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
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
                    )}
                </div>
            </div>
        </>
    );
}

function ClusterDialog({ regions }: { regions: Region[] }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', survey_region_id: '' });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/settings/survey-directories/clusters', {
            preserveScroll: true,
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
                    Add cluster
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add cluster</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="cluster-name">Name</Label>
                        <Input
                            id="cluster-name"
                            className="mt-1.5"
                            placeholder="e.g. South Cotabato"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div>
                        <Label htmlFor="cluster-region">Region</Label>
                        <select
                            id="cluster-region"
                            className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm"
                            value={form.data.survey_region_id}
                            onChange={(event) =>
                                form.setData(
                                    'survey_region_id',
                                    event.target.value,
                                )
                            }
                        >
                            <option value="">Select region</option>
                            {regions.map((region) => (
                                <option key={region.id} value={region.id}>
                                    {region.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={form.errors.survey_region_id} />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>Add cluster</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
