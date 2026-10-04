import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Check,
    History,
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
import { HeiCombobox } from '@/components/hei-combobox';
import type { HeiOption } from '@/components/hei-combobox';
import Heading from '@/components/heading';
import { selectClass } from '@/components/monitoring/shared';
import InputError from '@/components/input-error';
import {
    Filter,
    FilterBar,
    PlaceFilters,
    placeFilterCount,
} from '@/components/record-filters';
import type { PlaceKey } from '@/components/record-filters';
import { RegistrationPanel } from '@/components/registration-panel';
import type { RegionRegistration } from '@/components/registration-panel';
import { Badge } from '@/components/ui/badge';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
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
/** A role this manager may assign; `hei` roles never hold an office. */
type AssignableRole = Role & { hei: boolean };
type UserStatus = 'pending' | 'active' | 'inactive';
type Region = { id: number; name: string };
/** The offices this manager may place accounts in. */
type Offices = { national: boolean; regions: Region[] };
/** An institution, with the region the form picks first. */
type HeiChoice = HeiOption & { region_id: number };
type ManagedUser = {
    id: number;
    name: string;
    email: string;
    hei: HeiOption | null;
    mobile_number: string | null;
    status: UserStatus;
    roles: Role[];
    office: { national: boolean; region: Region | null };
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
type PagePermissions = {
    create: boolean;
    update: boolean;
    delete: boolean;
    /** Opening a person's activity log. */
    activity: boolean;
};
type Filters = {
    search: string;
    status: UserStatus | '';
    /** A role's slug. */
    role: string;
    region: string;
    hei: string;
};
/** The places to filter by, as the monitoring lists offer them. */
type Places = { regions: Region[]; heis: HeiOption[] };
type UserForm = {
    name: string;
    email: string;
    /** Only narrows the institutions; never sent. */
    region: string;
    survey_hei_id: string;
    password: string;
    password_confirmation: string;
    role_ids: number[];
    /** '' for no office, 'national' for the Central Office, or a region's id. */
    office: string;
};

const NATIONAL_OFFICE = 'national';

function officeValue(office: ManagedUser['office'] | undefined): string {
    if (office?.national) return NATIONAL_OFFICE;

    return office?.region ? String(office.region.id) : '';
}

function officeLabel(office: ManagedUser['office']): string | null {
    if (office.national) return 'Central Office · all regions';

    return office.region?.name ?? null;
}

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

export default function Users({
    users,
    roles,
    heis,
    heiRegions,
    offices,
    registration,
    statusCounts,
    filters,
    roleOptions,
    places,
    permissions,
}: {
    users: PaginatedUsers;
    roles: AssignableRole[];
    heis: HeiChoice[];
    heiRegions: Region[];
    offices: Offices;
    registration: RegionRegistration[];
    statusCounts: Record<UserStatus, number>;
    filters: Filters;
    roleOptions: Pick<Role, 'name' | 'slug'>[];
    places: Places;
    permissions: PagePermissions;
}) {
    const [search, setSearch] = useState(filters.search);
    const totalUsers =
        statusCounts.pending + statusCounts.active + statusCounts.inactive;
    // Role and place narrow the list; the status tabs count within them.
    const narrowed = Boolean(filters.role || filters.region || filters.hei);

    function visit(next: Partial<Filters>) {
        const query = { ...filters, ...next };
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

    /** Picking a place clears the places below it. */
    function pick(key: PlaceKey, value: string) {
        visit({
            [key]: value,
            ...(key === 'region' ? { hei: '' } : {}),
        });
    }

    const showActions =
        permissions.update || permissions.delete || permissions.activity;
    const emptyTitle = narrowed
        ? 'No users match these filters'
        : filters.search
          ? 'No matching users'
          : filters.status === 'pending'
            ? 'No pending registrations'
            : 'No users found';
    const emptyDescription = narrowed
        ? 'Try another role or place, or clear the filters to see every account.'
        : filters.search
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
                        <UserDialog
                            mode="create"
                            roles={roles}
                            heis={heis}
                            heiRegions={heiRegions}
                            offices={offices}
                        />
                    )}
                </div>

                <RegistrationPanel regions={registration} />

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

                <div className="@container overflow-hidden rounded-xl border bg-card">
                    {/* Applied as soon as they change, like the monitoring lists. */}
                    <FilterBar
                        label="Filter users"
                        filters={1 + placeFilterCount(places.regions)}
                    >
                        <Filter label="Role" id="role">
                            <FormSelect
                                id="role"
                                className={selectClass}
                                value={filters.role}
                                onChange={(value) => visit({ role: value })}
                                placeholder="All roles"
                                allowEmpty
                                options={roleOptions.map((option) => ({
                                    value: option.slug,
                                    label: option.name,
                                }))}
                            />
                        </Filter>
                        <PlaceFilters
                            values={filters}
                            onPick={pick}
                            regions={places.regions}
                            heis={places.heis}
                        />
                    </FilterBar>
                    {users.data.length === 0 ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                <UserRound className="size-5 text-muted-foreground" />
                            </span>
                            <h2 className="mt-4 font-medium">{emptyTitle}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {emptyDescription}
                            </p>
                            {narrowed && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-5"
                                    onClick={() =>
                                        visit({
                                            role: '',
                                            region: '',
                                            hei: '',
                                        })
                                    }
                                >
                                    Clear filters
                                </Button>
                            )}
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
                                                {officeLabel(user.office) && (
                                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                                        Office:{' '}
                                                        {officeLabel(
                                                            user.office,
                                                        )}
                                                    </p>
                                                )}
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
                                                        {permissions.activity && (
                                                            <Button
                                                                asChild
                                                                variant="ghost"
                                                                size="icon"
                                                                title="View activity"
                                                            >
                                                                <Link
                                                                    href={`/settings/activity-logs?user=${user.id}`}
                                                                >
                                                                    <History />
                                                                    <span className="sr-only">
                                                                        View
                                                                        activity
                                                                        of{' '}
                                                                        {
                                                                            user.name
                                                                        }
                                                                    </span>
                                                                </Link>
                                                            </Button>
                                                        )}
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
                                                                    heiRegions={
                                                                        heiRegions
                                                                    }
                                                                    offices={
                                                                        offices
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

function changeStatus(
    user: ManagedUser,
    status: UserStatus,
    visit?: ConfirmVisit,
) {
    router.patch(
        `/settings/users/${user.id}/status`,
        { status },
        // A refusal comes back as a red toast from the server.
        { preserveScroll: true, ...visit },
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
    return (
        <ConfirmPopover
            title={`Deactivate ${user.name}?`}
            description="They will be signed out and cannot log in until the account is reactivated. Their data is kept."
            confirmLabel="Deactivate"
            onConfirm={(visit) => changeStatus(user, 'inactive', visit)}
        >
            <Button variant="ghost" size="icon" title="Deactivate">
                <UserX />
                <span className="sr-only">Deactivate {user.name}</span>
            </Button>
        </ConfirmPopover>
    );
}

function UserDialog({
    mode,
    roles,
    heis,
    heiRegions,
    offices,
    user,
}: {
    mode: 'create' | 'edit';
    roles: AssignableRole[];
    heis: HeiChoice[];
    heiRegions: Region[];
    offices: Offices;
    user?: ManagedUser;
}) {
    const [open, setOpen] = useState(false);
    const fieldId = `${mode}-${user?.id ?? 'new'}`;
    const currentHei = heis.find((hei) => hei.id === user?.hei?.id);
    const form = useForm<UserForm>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        // An account's region is its institution's; with one region, it is
        // chosen already.
        region: currentHei
            ? String(currentHei.region_id)
            : heiRegions.length === 1
              ? String(heiRegions[0].id)
              : '',
        survey_hei_id: user?.hei ? String(user.hei.id) : '',
        password: '',
        password_confirmation: '',
        role_ids: user?.roles.map((role) => role.id) ?? [],
        office: officeValue(user?.office),
    });
    const chosen = (role: AssignableRole) =>
        form.data.role_ids.includes(role.id);
    // Where an account belongs follows its roles: HEI roles are placed by
    // their institution, CHED staff by their office.
    const heiAccount = roles.some((role) => role.hei && chosen(role));
    const staff = roles.some((role) => !role.hei && chosen(role));
    // Administrators run the whole system: the server always makes them
    // Central Office, so there is no office to pick.
    const administrator = roles.some(
        (role) => role.slug === 'admin' && chosen(role),
    );
    const regionHeis = heis.filter(
        (hei) => String(hei.region_id) === form.data.region,
    );
    // The server validates the two fields the office select is sent as.
    const errors: Partial<Record<string, string>> = form.errors;
    const officeError = errors.survey_region_id ?? errors.national_access;
    const officeOptions = [
        ...(offices.national
            ? [
                  {
                      value: NATIONAL_OFFICE,
                      label: 'Central Office — all regions',
                  },
              ]
            : []),
        ...offices.regions.map((region) => ({
            value: String(region.id),
            label: region.name,
        })),
    ];

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

        // The region only narrowed the list; the institution is what is kept.
        form.transform(({ office, region: _region, ...data }) => ({
            ...data,
            // Staff accounts have no institution; their office places them.
            survey_hei_id: heiAccount ? data.survey_hei_id : '',
            national_access:
                administrator || (staff && office === NATIONAL_OFFICE),
            survey_region_id:
                !administrator &&
                staff &&
                office !== '' &&
                office !== NATIONAL_OFFICE
                    ? Number(office)
                    : null,
        }));

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
                        Assign at least one role. HEI roles belong to an
                        institution; CHED roles to an office.
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
                                    checked={chosen(role)}
                                    onCheckedChange={(checked) =>
                                        toggleRole(role.id, checked === true)
                                    }
                                />
                                <span>{role.name}</span>
                            </label>
                        ))}
                        <InputError message={form.errors.role_ids} />
                    </fieldset>
                    {heiAccount && (
                        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-2">
                            <div className="grid content-start gap-2">
                                <Label htmlFor={`${fieldId}-region`}>
                                    Region
                                </Label>
                                <FormSelect
                                    id={`${fieldId}-region`}
                                    value={form.data.region}
                                    onChange={(value) =>
                                        form.setData((data) => ({
                                            ...data,
                                            region: value,
                                            survey_hei_id: '',
                                        }))
                                    }
                                    placeholder="Choose a region"
                                    options={heiRegions.map((region) => ({
                                        value: String(region.id),
                                        label: region.name,
                                    }))}
                                    className="rounded-[6px] data-[size=default]:h-11"
                                />
                            </div>
                            <div className="grid content-start gap-2">
                                <Label htmlFor={`${fieldId}-hei`}>
                                    Institution
                                </Label>
                                <HeiCombobox
                                    id={`${fieldId}-hei`}
                                    value={form.data.survey_hei_id}
                                    onChange={(value) =>
                                        form.setData('survey_hei_id', value)
                                    }
                                    options={regionHeis}
                                    disabled={form.data.region === ''}
                                    placeholder={
                                        form.data.region === ''
                                            ? 'Choose a region first'
                                            : 'Search or select an HEI'
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.survey_hei_id,
                                    )}
                                />
                                <InputError
                                    message={form.errors.survey_hei_id}
                                />
                            </div>
                        </div>
                    )}
                    {administrator && (
                        <p className="text-sm text-muted-foreground">
                            Administrators cover every region.
                        </p>
                    )}
                    {staff && !administrator && (
                        <div className="grid gap-2">
                            <Label htmlFor={`${fieldId}-office`}>Office</Label>
                            <FormSelect
                                id={`${fieldId}-office`}
                                value={form.data.office}
                                onChange={(value) =>
                                    form.setData('office', value)
                                }
                                placeholder="No office"
                                options={officeOptions}
                                allowEmpty
                                aria-describedby={`${fieldId}-office-help`}
                                aria-invalid={Boolean(officeError)}
                                className="rounded-[6px] data-[size=default]:h-11"
                            />
                            <p
                                id={`${fieldId}-office-help`}
                                className="text-xs text-muted-foreground"
                            >
                                Staff see monitoring reports from their office's
                                region. The Central Office sees every region.
                            </p>
                            <InputError message={officeError} />
                        </div>
                    )}
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
    return (
        <ConfirmPopover
            title={`Delete ${user.name}?`}
            description="They lose access immediately and this cannot be undone. Accounts with posts or comments can't be deleted; deactivate them instead to keep their school's record."
            confirmLabel="Delete user"
            onConfirm={(visit) =>
                router.delete(`/settings/users/${user.id}`, {
                    preserveScroll: true,
                    ...visit,
                })
            }
        >
            <Button variant="ghost" size="icon">
                <Trash2 />
                <span className="sr-only">Delete {user.name}</span>
            </Button>
        </ConfirmPopover>
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
