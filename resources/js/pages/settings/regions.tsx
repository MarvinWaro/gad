import { Head, router, useForm } from '@inertiajs/react';
import { Map, Plus } from 'lucide-react';
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
import { Trash2 } from 'lucide-react';

type Region = {
    id: number;
    name: string;
    is_active: boolean;
    clusters_count: number;
};
type Permissions = { create: boolean; update: boolean; delete: boolean };

export default function Regions({
    regions,
    permissions,
}: {
    regions: Region[];
    permissions: Permissions;
}) {
    return (
        <>
            <Head title="Regions" />
            <div className="space-y-6">
                <div className="flex justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Regions"
                        description="The top level of the institution directory. Respondents pick a region first, then a cluster, then their HEI."
                    />
                    {permissions.create && <RegionDialog />}
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                    {regions.length === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <Map className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                No regions configured
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                A survey cannot be published until at least one
                                active Region, Cluster and HEI exists.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-xs">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Clusters</th>
                                    <th className="px-5 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {regions.map((region) => (
                                    <tr key={region.id}>
                                        <td className="px-5 py-4">
                                            <span className="font-medium">
                                                {region.name}
                                            </span>
                                            {!region.is_active && (
                                                <Badge
                                                    variant="outline"
                                                    className="ml-2 align-middle text-muted-foreground"
                                                >
                                                    Inactive
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {region.clusters_count}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                {permissions.update && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.put(
                                                                `/settings/survey-directories/regions/${region.id}`,
                                                                {
                                                                    name: region.name,
                                                                    is_active:
                                                                        !region.is_active,
                                                                },
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {region.is_active
                                                            ? 'Deactivate'
                                                            : 'Activate'}
                                                    </Button>
                                                )}
                                                {permissions.delete && (
                                                    <IconAction
                                                        label="Delete this region"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() =>
                                                            confirm(
                                                                `Delete ${region.name}? Regions with clusters cannot be deleted — deactivate them instead.`,
                                                            ) &&
                                                            router.delete(
                                                                `/settings/survey-directories/regions/${region.id}`,
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

function RegionDialog() {
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '' });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/settings/survey-directories/regions', {
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
                    Add region
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add region</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="region-name">Name</Label>
                        <Input
                            id="region-name"
                            className="mt-1.5"
                            placeholder="e.g. Regional Office XII"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>Add region</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
