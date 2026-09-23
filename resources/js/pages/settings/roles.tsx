import { Head, router, useForm } from '@inertiajs/react';
import {
    LockKeyhole,
    Pencil,
    Plus,
    Search,
    Shield,
    Trash2,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

type Permission = { id: number; name: string; slug: string; group: string };
type PermissionGroup = { group: string; permissions: Permission[] };
type Role = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    users_count: number;
    permission_ids: number[];
    permissions_count: number;
    is_locked: boolean;
    can_manage: boolean;
};
type PagePermissions = { create: boolean; update: boolean; delete: boolean };
type RoleForm = {
    name: string;
    description: string;
    permission_ids: number[];
};

export default function Roles({
    roles,
    permissionGroups,
    filters,
    permissions,
}: {
    roles: Role[];
    permissionGroups: PermissionGroup[];
    filters: { search: string };
    permissions: PagePermissions;
}) {
    const [search, setSearch] = useState(filters.search);

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            '/settings/roles',
            search.trim() ? { search: search.trim() } : {},
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Roles & permissions" />
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <Heading
                        variant="small"
                        title="Roles & permissions"
                        description="Group system permissions into reusable access roles."
                    />
                    {permissions.create && (
                        <RoleDialog
                            mode="create"
                            permissionGroups={permissionGroups}
                        />
                    )}
                </div>

                <form
                    onSubmit={submitSearch}
                    className="flex max-w-sm gap-2"
                    role="search"
                >
                    <Label htmlFor="role-search" className="sr-only">
                        Search roles
                    </Label>
                    <Input
                        id="role-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search roles"
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <Search />
                        <span className="sr-only">Search</span>
                    </Button>
                </form>

                <div className="overflow-hidden rounded-xl border bg-card">
                    {roles.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <Shield className="size-5 text-muted-foreground" />
                            </span>
                            <h2 className="mt-4 font-medium">
                                No matching roles
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Try another role name or description.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[820px] text-left text-sm">
                                <caption className="sr-only">
                                    Roles and their permission counts
                                </caption>
                                <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">
                                            Role
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Description
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Users
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Permissions
                                        </th>
                                        {(permissions.update ||
                                            permissions.delete) && (
                                            <th className="px-5 py-3 text-right font-medium">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {roles.map((role) => (
                                        <tr key={role.id}>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 font-medium">
                                                    {role.is_locked ||
                                                    !role.can_manage ? (
                                                        <LockKeyhole className="size-4 text-primary" />
                                                    ) : (
                                                        <Shield className="size-4 text-muted-foreground" />
                                                    )}
                                                    {role.name}
                                                </div>
                                            </td>
                                            <td className="max-w-sm px-5 py-4 text-muted-foreground">
                                                {role.description ??
                                                    'No description'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge variant="secondary">
                                                    {role.users_count}{' '}
                                                    {role.users_count === 1
                                                        ? 'user'
                                                        : 'users'}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-4">
                                                <Badge variant="outline">
                                                    {role.is_locked
                                                        ? 'All permissions'
                                                        : `${role.permissions_count} permissions`}
                                                </Badge>
                                            </td>
                                            {(permissions.update ||
                                                permissions.delete) && (
                                                <td className="px-5 py-4">
                                                    {role.is_locked ? (
                                                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                                                            <LockKeyhole className="size-3.5" />
                                                            {role.is_locked
                                                                ? 'System locked'
                                                                : 'Restricted'}
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-1">
                                                            {permissions.update && (
                                                                <RoleDialog
                                                                    mode="edit"
                                                                    role={role}
                                                                    permissionGroups={
                                                                        permissionGroups
                                                                    }
                                                                />
                                                            )}
                                                            {permissions.delete && (
                                                                <DeleteRoleDialog
                                                                    role={role}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function RoleDialog({
    mode,
    permissionGroups,
    role,
}: {
    mode: 'create' | 'edit';
    permissionGroups: PermissionGroup[];
    role?: Role;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<RoleForm>({
        name: role?.name ?? '',
        description: role?.description ?? '',
        permission_ids: role?.permission_ids ?? [],
    });
    const totalPermissions = permissionGroups.reduce(
        (total, group) => total + group.permissions.length,
        0,
    );

    function togglePermission(permissionId: number, checked: boolean) {
        form.setData(
            'permission_ids',
            checked
                ? [...form.data.permission_ids, permissionId]
                : form.data.permission_ids.filter((id) => id !== permissionId),
        );
    }

    function toggleGroup(group: PermissionGroup, checked: boolean) {
        const groupIds = group.permissions.map((permission) => permission.id);
        form.setData(
            'permission_ids',
            checked
                ? Array.from(
                      new Set([...form.data.permission_ids, ...groupIds]),
                  )
                : form.data.permission_ids.filter(
                      (id) => !groupIds.includes(id),
                  ),
        );
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        };

        if (mode === 'create') {
            form.post('/settings/roles', options);
        } else {
            form.put(`/settings/roles/${role?.id}`, options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === 'create' ? (
                    <Button>
                        <Plus />
                        Add role
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon">
                        <Pencil />
                        <span className="sr-only">Edit {role?.name}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-4xl">
                <DialogHeader className="border-b px-6 pt-6 pb-4">
                    <DialogTitle>
                        {mode === 'create' ? 'Create role' : 'Edit role'}
                    </DialogTitle>
                    <DialogDescription className="text-foreground/80">
                        Choose the exact actions members of this role can
                        perform.
                    </DialogDescription>
                </DialogHeader>
                <form className="flex min-h-0 flex-col" onSubmit={submit}>
                    <div className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={`${mode}-${role?.id ?? 'new'}-role-name`}
                                >
                                    Role name
                                </Label>
                                <Input
                                    id={`${mode}-${role?.id ?? 'new'}-role-name`}
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    required
                                    maxLength={80}
                                />
                                <InputError message={form.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={`${mode}-${role?.id ?? 'new'}-role-description`}
                                >
                                    Description (optional)
                                </Label>
                                <Input
                                    id={`${mode}-${role?.id ?? 'new'}-role-description`}
                                    value={form.data.description}
                                    onChange={(event) =>
                                        form.setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={255}
                                />
                                <InputError message={form.errors.description} />
                            </div>
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between gap-4">
                                <h3 className="font-medium">Permissions</h3>
                                <span className="text-xs text-muted-foreground">
                                    {form.data.permission_ids.length} of{' '}
                                    {totalPermissions} selected
                                </span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                {permissionGroups.map((group) => {
                                    const selectedCount =
                                        group.permissions.filter((permission) =>
                                            form.data.permission_ids.includes(
                                                permission.id,
                                            ),
                                        ).length;
                                    const allSelected =
                                        selectedCount ===
                                        group.permissions.length;

                                    return (
                                        <fieldset
                                            key={group.group}
                                            className="overflow-hidden rounded-lg border"
                                        >
                                            <legend className="sr-only">
                                                {group.group}
                                            </legend>
                                            <label className="flex cursor-pointer items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                                                <span className="flex items-center gap-3 font-medium">
                                                    <Checkbox
                                                        checked={
                                                            allSelected
                                                                ? true
                                                                : selectedCount >
                                                                    0
                                                                  ? 'indeterminate'
                                                                  : false
                                                        }
                                                        onCheckedChange={(
                                                            checked,
                                                        ) =>
                                                            toggleGroup(
                                                                group,
                                                                checked ===
                                                                    true,
                                                            )
                                                        }
                                                    />
                                                    {group.group}
                                                </span>
                                                <span className="text-xs text-foreground/70">
                                                    {selectedCount}/
                                                    {group.permissions.length}
                                                </span>
                                            </label>
                                            <div className="grid gap-3 p-4">
                                                {group.permissions.map(
                                                    (permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex cursor-pointer items-center gap-3 text-sm"
                                                        >
                                                            <Checkbox
                                                                checked={form.data.permission_ids.includes(
                                                                    permission.id,
                                                                )}
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    togglePermission(
                                                                        permission.id,
                                                                        checked ===
                                                                            true,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                {
                                                                    permission.name
                                                                }
                                                            </span>
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </fieldset>
                                    );
                                })}
                            </div>
                            <InputError
                                className="mt-2"
                                message={form.errors.permission_ids}
                            />
                        </div>
                    </div>
                    <DialogFooter className="border-t px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {mode === 'create' ? 'Create role' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteRoleDialog({ role }: { role: Role }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 />
                    <span className="sr-only">Delete {role.name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete role?</DialogTitle>
                    <DialogDescription>
                        {role.users_count > 0
                            ? `${role.name} is assigned to ${role.users_count} users and cannot be deleted yet.`
                            : `${role.name} will be removed permanently.`}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={role.users_count > 0}
                        onClick={() =>
                            router.delete(`/settings/roles/${role.id}`, {
                                preserveScroll: true,
                                onSuccess: () => setOpen(false),
                            })
                        }
                    >
                        Delete role
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

Roles.layout = {
    breadcrumbs: [{ title: 'Roles & permissions', href: '/settings/roles' }],
};
