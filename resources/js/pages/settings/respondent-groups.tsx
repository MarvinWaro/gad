import { Head, router, useForm } from '@inertiajs/react';
import { ContactRound, Pencil, Plus, Trash2 } from 'lucide-react';
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

type RespondentGroup = {
    id: number;
    value: string;
    label: string;
    requires_text: boolean;
    is_active: boolean;
    sort_order: number;
};
type Permissions = { create: boolean; update: boolean; delete: boolean };

export default function RespondentGroups({
    respondentGroups,
    permissions,
}: {
    respondentGroups: RespondentGroup[];
    permissions: Permissions;
}) {
    return (
        <>
            <Head title="Respondent groups" />
            <div className="space-y-6">
                <div className="flex justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Respondent groups"
                        description="The groups every public survey offers when it asks who the respondent is."
                    />
                    {permissions.create && <RespondentGroupDialog />}
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                    {respondentGroups.length === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <ContactRound className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                No respondent groups configured
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Add at least one group so respondents can say
                                which they belong to.
                            </p>
                        </div>
                    ) : (
                        <RespondentGroupTable
                            groups={respondentGroups}
                            permissions={permissions}
                        />
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    A group&rsquo;s answer key is stored with every response and
                    never changes, so renaming a group keeps the answers already
                    collected against it.
                </p>
            </div>
        </>
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
