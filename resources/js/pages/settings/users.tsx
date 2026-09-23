import { Head, Link, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react';
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

type Role = { id: number; name: string; slug: string };
type ManagedUser = {
    id: number;
    name: string;
    email: string;
    roles: Role[];
    created_at: string | null;
    is_current_user: boolean;
    can_manage: boolean;
};
type PaginationLink = { url: string | null; label: string; active: boolean };
type PaginatedUsers = {
    data: ManagedUser[];
    from: number | null;
    to: number | null;
    total: number;
    last_page: number;
    links: PaginationLink[];
};
type PagePermissions = { create: boolean; update: boolean; delete: boolean };
type UserForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role_ids: number[];
};

export default function Users({
    users,
    roles,
    filters,
    permissions,
}: {
    users: PaginatedUsers;
    roles: Role[];
    filters: { search: string };
    permissions: PagePermissions;
}) {
    const [search, setSearch] = useState(filters.search);

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            '/settings/users',
            search.trim() ? { search: search.trim() } : {},
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="User management" />
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <Heading
                        variant="small"
                        title="Users"
                        description="Create accounts and assign their access roles."
                    />
                    {permissions.create && (
                        <UserDialog mode="create" roles={roles} />
                    )}
                </div>

                <form
                    onSubmit={submitSearch}
                    className="flex max-w-sm gap-2"
                    role="search"
                >
                    <Label htmlFor="user-search" className="sr-only">
                        Search users
                    </Label>
                    <Input
                        id="user-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search users or roles"
                    />
                    <Button type="submit" variant="outline" size="icon">
                        <Search />
                        <span className="sr-only">Search</span>
                    </Button>
                </form>

                <div className="overflow-hidden rounded-xl border bg-card">
                    {users.data.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <UserRound className="size-5 text-muted-foreground" />
                            </span>
                            <h2 className="mt-4 font-medium">
                                {filters.search
                                    ? 'No matching users'
                                    : 'No users found'}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {filters.search
                                    ? 'Try another name, email, or role.'
                                    : 'Create the first managed account.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <caption className="sr-only">
                                    Managed user accounts
                                </caption>
                                <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">
                                            User
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Roles
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Member since
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
                                    {users.data.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-5 py-4">
                                                <div className="font-medium">
                                                    {user.name}
                                                    {user.is_current_user && (
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-2"
                                                        >
                                                            You
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {user.roles.map((role) => (
                                                        <Badge
                                                            key={role.id}
                                                            variant="secondary"
                                                        >
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </td>
                                            {(permissions.update ||
                                                permissions.delete) && (
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        {permissions.update &&
                                                            user.can_manage && (
                                                                <UserDialog
                                                                    mode="edit"
                                                                    user={user}
                                                                    roles={
                                                                        roles
                                                                    }
                                                                />
                                                            )}
                                                        {permissions.delete &&
                                                            user.can_manage &&
                                                            !user.is_current_user && (
                                                                <DeleteUserDialog
                                                                    user={user}
                                                                />
                                                            )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {users.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-muted-foreground">
                                Showing {users.from}–{users.to} of {users.total}
                            </p>
                            <nav
                                className="flex flex-wrap gap-1"
                                aria-label="User pagination"
                            >
                                {users.links.map((link, index) => (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        asChild
                                        size="sm"
                                        variant={
                                            link.active
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        disabled={!link.url}
                                    >
                                        <Link
                                            href={link.url ?? '#'}
                                            preserveScroll
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function UserDialog({
    mode,
    roles,
    user,
}: {
    mode: 'create' | 'edit';
    roles: Role[];
    user?: ManagedUser;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<UserForm>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        password_confirmation: '',
        role_ids: user?.roles.map((role) => role.id) ?? [],
    });

    function toggleRole(roleId: number, checked: boolean) {
        form.setData(
            'role_ids',
            checked
                ? [...form.data.role_ids, roleId]
                : form.data.role_ids.filter((id) => id !== roleId),
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
            form.post('/settings/users', options);
        } else {
            form.put(`/settings/users/${user?.id}`, options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === 'create' ? (
                    <Button>
                        <Plus />
                        Add user
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon">
                        <Pencil />
                        <span className="sr-only">Edit {user?.name}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create user' : 'Edit user'}
                    </DialogTitle>
                    <DialogDescription>
                        Assign at least one role. Permissions are inherited from
                        every selected role.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit}>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label
                                htmlFor={`${mode}-${user?.id ?? 'new'}-name`}
                            >
                                Name
                            </Label>
                            <Input
                                id={`${mode}-${user?.id ?? 'new'}-name`}
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                                autoComplete="name"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor={`${mode}-${user?.id ?? 'new'}-email`}
                            >
                                Email address
                            </Label>
                            <Input
                                id={`${mode}-${user?.id ?? 'new'}-email`}
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                required
                                autoComplete="email"
                            />
                            <InputError message={form.errors.email} />
                        </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label
                                htmlFor={`${mode}-${user?.id ?? 'new'}-password`}
                            >
                                {mode === 'create'
                                    ? 'Password'
                                    : 'New password (optional)'}
                            </Label>
                            <Input
                                id={`${mode}-${user?.id ?? 'new'}-password`}
                                type="password"
                                value={form.data.password}
                                onChange={(event) =>
                                    form.setData('password', event.target.value)
                                }
                                required={mode === 'create'}
                                autoComplete="new-password"
                            />
                            <InputError message={form.errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label
                                htmlFor={`${mode}-${user?.id ?? 'new'}-password-confirmation`}
                            >
                                Confirm password
                            </Label>
                            <Input
                                id={`${mode}-${user?.id ?? 'new'}-password-confirmation`}
                                type="password"
                                value={form.data.password_confirmation}
                                onChange={(event) =>
                                    form.setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                required={
                                    mode === 'create' ||
                                    form.data.password.length > 0
                                }
                                autoComplete="new-password"
                            />
                        </div>
                    </div>
                    <fieldset className="grid gap-3 rounded-lg border p-4">
                        <legend className="px-1 text-sm font-medium">
                            Roles
                        </legend>
                        {roles.map((role) => (
                            <label
                                key={role.id}
                                className="flex cursor-pointer items-center gap-3 text-sm"
                            >
                                <Checkbox
                                    checked={form.data.role_ids.includes(
                                        role.id,
                                    )}
                                    onCheckedChange={(checked) =>
                                        toggleRole(role.id, checked === true)
                                    }
                                />
                                <span>{role.name}</span>
                            </label>
                        ))}
                        <InputError message={form.errors.role_ids} />
                    </fieldset>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {mode === 'create' ? 'Create user' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteUserDialog({ user }: { user: ManagedUser }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 />
                    <span className="sr-only">Delete {user.name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete user?</DialogTitle>
                    <DialogDescription>
                        {user.name} will lose access immediately. This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() =>
                            router.delete(`/settings/users/${user.id}`, {
                                preserveScroll: true,
                                onSuccess: () => setOpen(false),
                            })
                        }
                    >
                        Delete user
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(value));
}

Users.layout = {
    breadcrumbs: [{ title: 'Users', href: '/settings/users' }],
};
