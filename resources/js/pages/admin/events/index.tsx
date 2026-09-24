import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { EventCategoryLabel } from '@/components/hei/event-category';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import {
    eventCategories,
    formatEventTime,
    parseWallClock,
} from '@/lib/event-dates';
import type { CalendarEvent, EventCategory } from '@/types';

type AdminEvent = CalendarEvent & { created_by: string | null };

type PaginationLink = { url: string | null; label: string; active: boolean };

type PaginatedEvents = {
    data: AdminEvent[];
    from: number | null;
    to: number | null;
    total: number;
    last_page: number;
    links: PaginationLink[];
};

type Permissions = { create: boolean; update: boolean; delete: boolean };

type EventForm = {
    title: string;
    category: EventCategory;
    is_all_day: boolean;
    starts_at: string;
    ends_at: string;
    location: string;
    description: string;
};

const dateFormat = new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

export default function EventsIndex({
    events,
    categories,
    filters,
    permissions,
}: {
    events: PaginatedEvents;
    categories: EventCategory[];
    filters: { search: string };
    permissions: Permissions;
}) {
    const [search, setSearch] = useState(filters.search);

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            '/admin/events',
            search.trim() ? { search: search.trim() } : {},
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="GAD events" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-2xl font-medium">GAD events</h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Regional trainings, campaigns, meetings, and
                            deadlines. HEI users see these on their home
                            calendar. Times are Philippine time.
                        </p>
                    </div>
                    {permissions.create && (
                        <EventDialog mode="create" categories={categories} />
                    )}
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="gap-4 border-b py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>All events</CardTitle>
                            <CardDescription className="mt-1">
                                {events.total}{' '}
                                {events.total === 1 ? 'event' : 'events'},
                                newest first
                            </CardDescription>
                        </div>
                        <form
                            className="flex w-full gap-2 sm:w-auto"
                            onSubmit={submitSearch}
                            role="search"
                        >
                            <Label htmlFor="event-search" className="sr-only">
                                Search events
                            </Label>
                            <Input
                                id="event-search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search title or location"
                                className="sm:w-64"
                            />
                            <Button type="submit" variant="outline" size="icon">
                                <Search />
                                <span className="sr-only">Search</span>
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0">
                        {events.data.length === 0 ? (
                            <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                                    <CalendarDays className="size-5 text-muted-foreground" />
                                </span>
                                <h2 className="mt-4 font-medium">
                                    {filters.search
                                        ? 'No matching events'
                                        : 'No events yet'}
                                </h2>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    {filters.search
                                        ? 'Try a different search term.'
                                        : 'Add the first regional event. It appears on every HEI home calendar right away.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <caption className="sr-only">
                                        GAD events, newest first
                                    </caption>
                                    <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">
                                                Event
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                When
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Category
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Added by
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
                                        {events.data.map((event) => (
                                            <tr key={event.id}>
                                                <td className="max-w-80 px-5 py-4">
                                                    <p className="font-medium">
                                                        {event.title}
                                                    </p>
                                                    {event.location && (
                                                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                            <MapPin
                                                                aria-hidden
                                                                className="size-3"
                                                            />
                                                            {event.location}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 tabular-nums">
                                                    <p>
                                                        {dateFormat.format(
                                                            parseWallClock(
                                                                event.starts_at,
                                                            ),
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {formatEventTime(event)}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <EventCategoryLabel
                                                        category={
                                                            event.category
                                                        }
                                                        className="text-sm text-foreground"
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {event.created_by ?? '—'}
                                                </td>
                                                {(permissions.update ||
                                                    permissions.delete) && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-1">
                                                            {permissions.update && (
                                                                <EventDialog
                                                                    mode="edit"
                                                                    event={
                                                                        event
                                                                    }
                                                                    categories={
                                                                        categories
                                                                    }
                                                                />
                                                            )}
                                                            {permissions.delete && (
                                                                <DeleteEventDialog
                                                                    event={
                                                                        event
                                                                    }
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
                        {events.last_page > 1 && (
                            <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground">
                                    Showing {events.from}–{events.to} of{' '}
                                    {events.total}
                                </p>
                                <nav
                                    className="flex flex-wrap gap-1"
                                    aria-label="Event pagination"
                                >
                                    {events.links.map((link, index) => (
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
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

/** `2026-10-02T09:00:00` → the value a date or datetime-local input expects. */
function toInputValue(value: string | null, allDay: boolean): string {
    if (!value) {
        return '';
    }

    return allDay ? value.slice(0, 10) : value.slice(0, 16);
}

function EventDialog({
    mode,
    categories,
    event,
}: {
    mode: 'create' | 'edit';
    categories: EventCategory[];
    event?: AdminEvent;
}) {
    const [open, setOpen] = useState(false);
    const id = `${mode}-${event?.id ?? 'new'}`;
    const form = useForm<EventForm>({
        title: event?.title ?? '',
        category: event?.category ?? 'training',
        is_all_day: event?.is_all_day ?? false,
        starts_at: toInputValue(
            event?.starts_at ?? null,
            event?.is_all_day ?? false,
        ),
        ends_at: toInputValue(
            event?.ends_at ?? null,
            event?.is_all_day ?? false,
        ),
        location: event?.location ?? '',
        description: event?.description ?? '',
    });

    function setAllDay(allDay: boolean) {
        form.setData((data) => ({
            ...data,
            is_all_day: allDay,
            starts_at: allDay
                ? data.starts_at.slice(0, 10)
                : data.starts_at && `${data.starts_at.slice(0, 10)}T09:00`,
            ends_at: allDay
                ? data.ends_at.slice(0, 10)
                : data.ends_at && `${data.ends_at.slice(0, 10)}T17:00`,
        }));
    }

    function submit(submitEvent: FormEvent<HTMLFormElement>) {
        submitEvent.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);

                if (mode === 'create') {
                    form.reset();
                }
            },
        };

        if (mode === 'create') {
            form.post('/admin/events', options);
        } else {
            form.put(`/admin/events/${event?.id}`, options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {mode === 'create' ? (
                    <Button>
                        <Plus />
                        Add event
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon">
                        <Pencil />
                        <span className="sr-only">Edit {event?.title}</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Add event' : 'Edit event'}
                    </DialogTitle>
                    <DialogDescription>
                        Enter Philippine time. HEI users see the event on their
                        calendar as soon as it is saved.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-title`}>Title</Label>
                        <Input
                            id={`${id}-title`}
                            value={form.data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            maxLength={160}
                            required
                        />
                        <InputError message={form.errors.title} />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-category`}>Category</Label>
                            <FormSelect
                                id={`${id}-category`}
                                value={form.data.category}
                                onChange={(value) =>
                                    form.setData(
                                        'category',
                                        value as EventCategory,
                                    )
                                }
                                placeholder="Select a category"
                                options={categories.map((category) => ({
                                    value: category,
                                    label: eventCategories[category].label,
                                }))}
                                className="rounded-[6px] data-[size=default]:h-11"
                            />
                            <InputError message={form.errors.category} />
                        </div>
                        <div className="flex items-end pb-3">
                            <label className="flex cursor-pointer items-center gap-3 text-sm">
                                <Checkbox
                                    checked={form.data.is_all_day}
                                    onCheckedChange={(checked) =>
                                        setAllDay(checked === true)
                                    }
                                />
                                All-day event
                            </label>
                        </div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-starts`}>
                                {form.data.is_all_day ? 'Start date' : 'Starts'}
                            </Label>
                            <Input
                                id={`${id}-starts`}
                                type={
                                    form.data.is_all_day
                                        ? 'date'
                                        : 'datetime-local'
                                }
                                value={form.data.starts_at}
                                onChange={(e) =>
                                    form.setData('starts_at', e.target.value)
                                }
                                required
                            />
                            <InputError message={form.errors.starts_at} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-ends`}>
                                {form.data.is_all_day
                                    ? 'End date (optional)'
                                    : 'Ends (optional)'}
                            </Label>
                            <Input
                                id={`${id}-ends`}
                                type={
                                    form.data.is_all_day
                                        ? 'date'
                                        : 'datetime-local'
                                }
                                value={form.data.ends_at}
                                min={form.data.starts_at || undefined}
                                onChange={(e) =>
                                    form.setData('ends_at', e.target.value)
                                }
                            />
                            <InputError message={form.errors.ends_at} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-location`}>
                            Location (optional)
                        </Label>
                        <Input
                            id={`${id}-location`}
                            value={form.data.location}
                            onChange={(e) =>
                                form.setData('location', e.target.value)
                            }
                            maxLength={160}
                            placeholder="Venue, city, or online link"
                        />
                        <InputError message={form.errors.location} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-description`}>
                            Details (optional)
                        </Label>
                        <textarea
                            id={`${id}-description`}
                            value={form.data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            rows={4}
                            maxLength={2000}
                            className="w-full rounded-[6px] border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm"
                        />
                        <InputError message={form.errors.description} />
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
                            {form.processing
                                ? 'Saving…'
                                : mode === 'create'
                                  ? 'Add event'
                                  : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteEventDialog({ event }: { event: AdminEvent }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Trash2 />
                    <span className="sr-only">Delete {event.title}</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete this event?</DialogTitle>
                    <DialogDescription>
                        “{event.title}” will be removed from every HEI calendar.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Keep event
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() =>
                            router.delete(`/admin/events/${event.id}`, {
                                preserveScroll: true,
                                onSuccess: () => setOpen(false),
                            })
                        }
                    >
                        Delete event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

EventsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
    ],
};
