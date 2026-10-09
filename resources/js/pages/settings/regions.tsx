import { Head, router, useForm } from '@inertiajs/react';
import { Map, Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { Pagination, type Paginated } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
    heis_count: number;
    office_city: string | null;
    office_address: string | null;
    office_email: string | null;
    office_website: string | null;
    office_phone: string | null;
    /** The Central Office for any region, an office for its own. */
    can_edit_office: boolean;
};

const officeFields = [
    {
        key: 'office_city',
        label: 'City',
        placeholder: 'City, as on the letterhead',
        type: 'text',
    },
    {
        key: 'office_address',
        label: 'Address',
        placeholder: 'Building, street, city',
        type: 'text',
    },
    {
        key: 'office_email',
        label: 'Email',
        placeholder: 'name@ched.gov.ph',
        type: 'email',
    },
    {
        key: 'office_website',
        label: 'Website',
        placeholder: 'example.gov.ph',
        type: 'text',
    },
    {
        key: 'office_phone',
        label: 'Phone and fax',
        placeholder: 'Numbers, as on the letterhead',
        type: 'text',
    },
] as const;
type Permissions = { create: boolean; update: boolean; delete: boolean };

export default function Regions({
    regions,
    permissions,
}: {
    regions: Paginated<Region>;
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
                        description="The top level of the institution directory. Respondents pick a region first, then their HEI."
                    />
                    {permissions.create && <RegionDialog />}
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                    {regions.data.length === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <Map className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                No regions configured
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                A survey cannot be published until at least one
                                active Region and HEI exists.
                            </p>
                        </div>
                    ) : (
                        <>
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-muted/50 text-xs">
                                    <tr>
                                        <th className="px-5 py-3">Name</th>
                                        <th className="px-5 py-3">HEIs</th>
                                        <th className="px-5 py-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {regions.data.map((region) => (
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
                                            <td className="px-5 py-4 text-muted-foreground tabular-nums">
                                                {region.heis_count}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    {region.can_edit_office && (
                                                        <OfficeDialog
                                                            region={region}
                                                        />
                                                    )}
                                                    {permissions.update &&
                                                        (region.is_active ? (
                                                            <ConfirmPopover
                                                                title={`Deactivate ${region.name}?`}
                                                                description="It will be hidden from the public surveys. Its institutions and responses are kept, and you can activate it again anytime."
                                                                confirmLabel="Deactivate"
                                                                onConfirm={(
                                                                    visit,
                                                                ) =>
                                                                    toggleActive(
                                                                        region,
                                                                        visit,
                                                                    )
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
                                                                    toggleActive(
                                                                        region,
                                                                    )
                                                                }
                                                            >
                                                                Activate
                                                            </Button>
                                                        ))}
                                                    {permissions.delete && (
                                                        <ConfirmPopover
                                                            title={`Delete ${region.name}?`}
                                                            description="Regions with institutions cannot be deleted. Deactivate them instead."
                                                            confirmLabel="Delete"
                                                            onConfirm={(
                                                                visit,
                                                            ) =>
                                                                router.delete(
                                                                    `/settings/survey-directories/regions/${region.id}`,
                                                                    {
                                                                        preserveScroll: true,
                                                                        ...visit,
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <IconAction
                                                                label="Delete this region"
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
                            <Pagination
                                page={regions}
                                label="regions"
                                persistent
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

function toggleActive(region: Region, visit?: ConfirmVisit) {
    router.put(
        `/settings/survey-directories/regions/${region.id}`,
        { name: region.name, is_active: !region.is_active },
        { preserveScroll: true, ...visit },
    );
}

/** The letterhead printed on the office's documents, such as monitoring reports. */
function OfficeDialog({ region }: { region: Region }) {
    const [open, setOpen] = useState(false);
    const saved = () => ({
        office_city: region.office_city ?? '',
        office_address: region.office_address ?? '',
        office_email: region.office_email ?? '',
        office_website: region.office_website ?? '',
        office_phone: region.office_phone ?? '',
    });
    const form = useForm(saved());

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/settings/regions/${region.id}/office`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                // It opens with what is saved: a cancelled change is gone.
                if (next) {
                    form.setData(saved());
                    form.clearErrors();
                }
                setOpen(next);
            }}
        >
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    Office details
                    <span className="sr-only"> for {region.name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Office details</DialogTitle>
                    <DialogDescription>
                        For {region.name}: printed on the letterhead of its
                        documents, such as monitoring reports. Leave a field
                        blank to leave its line out.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    {officeFields.map((field) => (
                        <div key={field.key}>
                            <Label htmlFor={`${field.key}-${region.id}`}>
                                {field.label}
                            </Label>
                            <Input
                                id={`${field.key}-${region.id}`}
                                type={field.type}
                                className="mt-1.5"
                                placeholder={field.placeholder}
                                value={form.data[field.key]}
                                onChange={(event) =>
                                    form.setData(field.key, event.target.value)
                                }
                                aria-invalid={Boolean(form.errors[field.key])}
                            />
                            <InputError message={form.errors[field.key]} />
                        </div>
                    ))}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>
                            Save office details
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
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
                            placeholder="e.g. Regional Office I"
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
