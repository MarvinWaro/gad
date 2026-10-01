import { Head, router, useForm } from '@inertiajs/react';
import { CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { Pagination, type Paginated } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type AcademicYear = {
    id: string;
    start_year: number;
    label: string;
    is_active: boolean;
    has_records: boolean;
};

type Permissions = { create: boolean; update: boolean; delete: boolean };

export default function AcademicYears({
    academicYears,
    permissions,
    filters,
}: {
    academicYears: Paginated<AcademicYear>;
    permissions: Permissions;
    filters: { search: string };
}) {
    const [editor, setEditor] = useState<AcademicYear | 'new' | null>(null);
    const [search, setSearch] = useState(filters.search);

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            '/settings/academic-years',
            search.trim() ? { search: search.trim() } : {},
            { preserveScroll: true, preserveState: true, replace: true },
        );
    }

    function setActive(year: AcademicYear, isActive: boolean) {
        router.put(
            `/settings/academic-years/${year.id}`,
            { start_year: year.start_year, is_active: isActive },
            { preserveScroll: true },
        );
    }

    return (
        <>
            <Head title="Academic years" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        variant="small"
                        title="Academic years"
                        description="Manage the years available for monitoring reports and GAD checklists. Enter the first year; the next year is filled in for you."
                    />
                    {permissions.create && (
                        <Button onClick={() => setEditor('new')}>
                            <Plus /> Add academic year
                        </Button>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <form
                        onSubmit={submitSearch}
                        role="search"
                        className="flex flex-wrap items-end gap-2 border-b p-4"
                    >
                        <div className="min-w-40 flex-1 sm:max-w-64">
                            <Label htmlFor="academic-year-search">
                                Search academic years
                            </Label>
                            <Input
                                id="academic-year-search"
                                className="mt-1.5"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="e.g. 2025"
                                maxLength={9}
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Search
                        </Button>
                        {filters.search && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    setSearch('');
                                    router.get(
                                        '/settings/academic-years',
                                        {},
                                        {
                                            preserveScroll: true,
                                            preserveState: true,
                                            replace: true,
                                        },
                                    );
                                }}
                            >
                                Clear
                            </Button>
                        )}
                    </form>
                    {academicYears.data.length === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <CalendarRange className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                {filters.search
                                    ? 'No academic years match your search'
                                    : 'No academic years configured'}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {filters.search
                                    ? 'Try a different year.'
                                    : 'Add a year to make it available in reports and checklists.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[460px] text-left text-sm">
                                    <thead className="border-b bg-muted/50 text-xs">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-5 py-3"
                                            >
                                                Academic year
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-5 py-3"
                                            >
                                                Status
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-5 py-3 text-right"
                                            >
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {academicYears.data.map((year) => (
                                            <tr key={year.id}>
                                                <td className="px-5 py-4 font-medium whitespace-nowrap">
                                                    {year.label}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge
                                                        variant={
                                                            year.is_active
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                    >
                                                        {year.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {permissions.update && (
                                                            <>
                                                                <IconAction
                                                                    label={`Edit ${year.label}`}
                                                                    onClick={() =>
                                                                        setEditor(
                                                                            year,
                                                                        )
                                                                    }
                                                                >
                                                                    <Pencil />
                                                                </IconAction>
                                                                {year.is_active ? (
                                                                    <ConfirmPopover
                                                                        title={`Deactivate ${year.label}?`}
                                                                        description="It will no longer be offered for new reports or checklist answers. Existing records remain available."
                                                                        confirmLabel="Deactivate"
                                                                        onConfirm={(
                                                                            visit,
                                                                        ) =>
                                                                            router.put(
                                                                                `/settings/academic-years/${year.id}`,
                                                                                {
                                                                                    start_year:
                                                                                        year.start_year,
                                                                                    is_active: false,
                                                                                },
                                                                                {
                                                                                    preserveScroll: true,
                                                                                    ...visit,
                                                                                },
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
                                                                            setActive(
                                                                                year,
                                                                                true,
                                                                            )
                                                                        }
                                                                    >
                                                                        Activate
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                        {permissions.delete &&
                                                            !year.has_records && (
                                                                <ConfirmPopover
                                                                    title={`Delete ${year.label}?`}
                                                                    description="This academic year will be removed from the list."
                                                                    confirmLabel="Delete"
                                                                    onConfirm={(
                                                                        visit,
                                                                    ) =>
                                                                        router.delete(
                                                                            `/settings/academic-years/${year.id}`,
                                                                            {
                                                                                preserveScroll: true,
                                                                                ...visit,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <IconAction
                                                                        label={`Delete ${year.label}`}
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
                            <Pagination
                                page={academicYears}
                                label="academic years"
                                persistent
                            />
                        </>
                    )}
                </div>
            </div>
            {editor && (
                <AcademicYearDialog
                    key={editor === 'new' ? 'new' : editor.id}
                    year={editor === 'new' ? null : editor}
                    onClose={() => setEditor(null)}
                />
            )}
        </>
    );
}

function AcademicYearDialog({
    year,
    onClose,
}: {
    year: AcademicYear | null;
    onClose: () => void;
}) {
    const form = useForm({
        start_year: year ? String(year.start_year) : '',
        is_active: year?.is_active ?? true,
    });
    const start = Number(form.data.start_year);
    const validStart = /^\d{4}$/.test(form.data.start_year) && start <= 9998;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };
        if (year) {
            form.put(`/settings/academic-years/${year.id}`, options);
        } else {
            form.post('/settings/academic-years', options);
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {year ? 'Edit academic year' : 'Add academic year'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <Label htmlFor="academic-start-year">
                            Starting year
                        </Label>
                        <div className="mt-1.5 flex items-center gap-3">
                            <Input
                                id="academic-start-year"
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={4}
                                pattern="[0-9]{4}"
                                placeholder="2025"
                                value={form.data.start_year}
                                onChange={(event) =>
                                    form.setData(
                                        'start_year',
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                aria-invalid={Boolean(form.errors.start_year)}
                                className="max-w-36"
                                required
                            />
                            <span
                                aria-hidden="true"
                                className="text-muted-foreground"
                            >
                                →
                            </span>
                            <output
                                htmlFor="academic-start-year"
                                className="font-medium tabular-nums"
                                aria-live="polite"
                            >
                                {validStart ? start + 1 : 'Next year'}
                            </output>
                        </div>
                        <p
                            className="mt-2 text-sm text-muted-foreground"
                            aria-live="polite"
                        >
                            {validStart
                                ? `Academic year ${start}-${start + 1}`
                                : 'Enter four digits to preview the academic year.'}
                        </p>
                        <InputError message={form.errors.start_year} />
                    </div>
                    {year && (
                        <div className="flex items-center gap-2">
                            <input
                                id="academic-year-active"
                                type="checkbox"
                                checked={form.data.is_active}
                                onChange={(event) =>
                                    form.setData(
                                        'is_active',
                                        event.target.checked,
                                    )
                                }
                                className="size-4 accent-primary"
                            />
                            <Label htmlFor="academic-year-active">Active</Label>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing || !validStart}>
                            {year ? 'Save changes' : 'Add academic year'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
