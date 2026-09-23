import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Check,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserCheck,
    UserRound,
    UserX,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { HeiCombobox } from '@/components/hei-combobox';
import type { HeiOption } from '@/components/hei-combobox';
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
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Role = { id: number; name: string; slug: string };
type UserStatus = 'pending' | 'active' | 'inactive';
type ManagedUser = {
    id: number;
    name: string;
    email: string;
    hei: HeiOption | null;
    mobile_number: string | null;
    sex: string | null;
    status: UserStatus;
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
type Filters = { search: string; status: UserStatus | '' };
type UserForm = {
    name: string;
    email: string;
    survey_hei_id: string;
    mobile_number: string;
    sex: string;
    password: string;
    password_confirmation: string;
    role_ids: number[];
};

const statusTabs: { value: UserStatus | ''; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const statusBadges: Record<UserStatus, { label: string; className: string }> = {
    pending: {
        label: 'Pending',
        className:
            'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    },
    active: {
        label: 'Active',
        className:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    },
    inactive: {
        label: 'Inactive',
        className: 'bg-muted text-muted-foreground',
    },
};

const sexOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
];

export default function Users({
    users,
    roles,
    heis,
    statusCounts,
    filters,
    permissions,
}: {
    users: PaginatedUsers;
    roles: Role[];
    heis: HeiOption[];
    statusCounts: Record<UserStatus, number>;
    filters: Filters;
    permissions: PagePermissions;
}) {
    const [search, setSearch] = useState(filters.search);
    const totalUsers =
        statusCounts.pending + statusCounts.active + statusCounts.inactive;

    function visit(next: Partial<Filters>) {
        const query = {
            search: filters.search,
            status: filters.status,
            ...next,
        };
        router.get(
            '/settings/users',
            Object.fromEntries(
                Object.entries(query).filter(([, value]) => value !== ''),
            ),
            { preserveState: true, replace: true },
        );
    }

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        visit({ search: search.trim() });
    }

    const showActions = permissions.update || permissions.delete;
    const emptyTitle = filters.search
        ? 'No matching users'
        : filters.status === 'pending'
          ? 'No pending registrations'
          : 'No users found';
    const emptyDescription = filters.search
        ? 'Try another name, email, role, or institution.'
        : filters.status === 'pending'
          ? 'New registrations will appear here for approval.'
          : 'Create the first managed account.';

    return (
        <>
            <Head title="User management" />
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <Heading
                        variant="small"
                        title="Users"
                        description="Approve registrations, create accounts, and assign their access roles."
                    />
                    {permissions.create && (
                        <UserDialog mode="create" roles={roles} heis={heis} />
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <nav
                        className="flex max-w-full shrink-0 gap-1 overflow-x-auto rounded-lg bg-muted p-1"
                        aria-label="Filter users by status"
                    >
                        {statusTabs.map((tab) => {
                            const active = filters.status === tab.value;
                            const count =
                                tab.value === ''
                                    ? totalUsers
                                    : statusCounts[tab.value];

                            return (
                                <button
                                    key={tab.label}
                                    type="button"
                                    aria-current={active ? 'page' : undefined}
                                    onClick={() => visit({ status: tab.value })}
                                    className={cn(
                                        'flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                                        active
                                            ? 'bg-background text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {tab.label}
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 text-xs tabular-nums',
                                            tab.value === 'pending' && count > 0
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-foreground/10',
                                        )}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>

                    <form
                        onSubmit={submitSearch}
                        className="flex min-w-64 flex-1 gap-2 sm:max-w-sm"
                        role="search"
                    >
                        <Label htmlFor="user-search" className="sr-only">
                            Search users
                        </Label>
                        <Input
                            id="user-search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search users, roles, or HEIs"
                        />
                        <Button type="submit" variant="outline" size="icon">
                            <Search />
                            <span className="sr-only">Search</span>
                        </Button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    {users.data.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <UserRound className="size-5 text-muted-foreground" />
                            </span>
                            <h2 className="mt-4 font-medium">{emptyTitle}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {emptyDescription}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left text-sm">
                                <caption className="sr-only">
                                    Managed user accounts
                                </caption>
                                <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            User
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Institution
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Status &amp; roles
                                        </th>
                                        {showActions && (
                                            <th className="sticky right-0 bg-card bg-linear-to-r from-muted/50 to-muted/50 px-4 py-3 text-right font-medium shadow-[-12px_0_12px_-12px_rgb(0_0_0/0.18)]">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {users.data.map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-4 py-4">
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
                                                {user.mobile_number && (
                                                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                                        {formatMobile(
                                                            user.mobile_number,
                                                        )}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="min-w-40 px-4 py-4">
                                                {user.hei ? (
                                                    <span>{user.hei.name}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            statusBadges[
                                                                user.status
                                                            ].className
                                                        }
                                                    >
                                                        {
                                                            statusBadges[
                                                                user.status
                                                            ].label
                                                        }
                                                    </Badge>
                                                    {user.roles.map((role) => (
                                                        <Badge
                                                            key={role.id}
                                                            variant="outline"
                                                        >
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <p className="mt-1.5 text-xs whitespace-nowrap text-muted-foreground">
                                                    Joined{' '}
                                                    {formatDate(
                                                        user.created_at,
                                                    )}
                                                </p>
                                            </td>
                                            {showActions && (
                                                <td className="sticky right-0 bg-card px-4 py-4 shadow-[-12px_0_12px_-12px_rgb(0_0_0/0.18)]">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {permissions.update &&
                                                            user.can_manage &&
                                                            !user.is_current_user && (
                                                                <StatusAction
                                                                    user={user}
                                                                />
                                                            )}
                                                        {permissions.update &&
                                                            user.can_manage && (
                                                                <UserDialog
                                                                    mode="edit"
                                                                    user={user}
                                                                    roles={
                                                                        roles
                                                                    }
                                                                    heis={heis}
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

function changeStatus(
    user: ManagedUser,
    status: UserStatus,
    onDone?: () => void,
) {
    router.patch(
        `/settings/users/${user.id}/status`,
        { status },
        {
            preserveScroll: true,
            onSuccess: () => onDone?.(),
            onError: (errors) => {
                const message = Object.values(errors)[0];

                if (message) {
                    toast.error(message);
                }
            },
        },
    );
}

function StatusAction({ user }: { user: ManagedUser }) {
    if (user.status === 'pending') {
        return (
            <Button
                size="sm"
                variant="outline"
                onClick={() => changeStatus(user, 'active')}
            >
                <Check />
                Approve
                <span className="sr-only">{user.name}</span>
            </Button>
        );
    }

    if (user.status === 'inactive') {
        return (
            <Button
                variant="ghost"
                size="icon"
                title="Reactivate"
                onClick={() => changeStatus(user, 'active')}
            >
                <UserCheck />
                <span className="sr-only">Reactivate {user.name}</span>
            </Button>
        );
    }

    return <DeactivateUserDialog user={user} />;
}

function DeactivateUserDialog({ user }: { user: ManagedUser }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Deactivate">
                    <UserX />
                    <span className="sr-only">Deactivate {user.name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deactivate account?</DialogTitle>
                    <DialogDescription>
                        {user.name} will be signed out and cannot log in until
                        the account is reactivated. Their data is kept.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() =>
                            changeStatus(user, 'inactive', () => setOpen(false))
                        }
                    >
                        Deactivate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UserDialog({
    mode,
    roles,
    heis,
    user,
}: {
    mode: 'create' | 'edit';
    roles: Role[];
    heis: HeiOption[];
    user?: ManagedUser;
}) {
    const [open, setOpen] = useState(false);
    const fieldId = `${mode}-${user?.id ?? 'new'}`;
    const form = useForm<UserForm>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        survey_hei_id: user?.hei ? String(user.hei.id) : '',
        mobile_number: user?.mobile_number ?? '',
        sex: user?.sex ?? '',
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
                            <Label htmlFor={`${fieldId}-name`}>Name</Label>
                            <Input
                                id={`${fieldId}-name`}
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
                            <Label htmlFor={`${fieldId}-email`}>
                                Email address
                            </Label>
                            <Input
                                id={`${fieldId}-email`}
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
                    <div className="grid gap-2">
                        <Label htmlFor={`${fieldId}-hei`}>
                            Institution (optional)
                        </Label>
                        <HeiCombobox
                            id={`${fieldId}-hei`}
                            value={form.data.survey_hei_id}
                            onChange={(value) =>
                                form.setData('survey_hei_id', value)
                            }
                            options={heis}
                            placeholder="Search or select an HEI"
                            allowClear
                            aria-invalid={Boolean(form.errors.survey_hei_id)}
                        />
                        <InputError message={form.errors.survey_hei_id} />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-mobile`}>
                                Mobile number (optional)
                            </Label>
                            <Input
                                id={`${fieldId}-mobile`}
                                type="tel"
                                inputMode="numeric"
                                value={form.data.mobile_number}
                                onChange={(event) =>
                                    form.setData(
                                        'mobile_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="09XX XXX XXXX"
                                maxLength={16}
                                autoComplete="off"
                            />
                            <InputError message={form.errors.mobile_number} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-sex`}>
                                Sex (optional)
                            </Label>
                            <FormSelect
                                id={`${fieldId}-sex`}
                                value={form.data.sex}
                                onChange={(value) => form.setData('sex', value)}
                                placeholder="Not specified"
                                options={sexOptions}
                                allowEmpty
                                className="rounded-[6px] data-[size=default]:h-11"
                            />
                            <InputError message={form.errors.sex} />
                        </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-password`}>
                                {mode === 'create'
                                    ? 'Password'
                                    : 'New password (optional)'}
                            </Label>
                            <Input
                                id={`${fieldId}-password`}
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
                            <Label htmlFor={`${fieldId}-password-confirmation`}>
                                Confirm password
                            </Label>
                            <Input
                                id={`${fieldId}-password-confirmation`}
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

function formatMobile(value: string): string {
    return /^09\d{9}$/.test(value)
        ? `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`
        : value;
}

Users.layout = {
    breadcrumbs: [{ title: 'Users', href: '/settings/users' }],
};
