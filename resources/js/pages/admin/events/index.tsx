import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Ban,
    CalendarDays,
    MapPin,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { EventStatusBadge } from '@/components/events/event-status-badge';
import { EventCategoryLabel } from '@/components/hei/event-category';
import InputError from '@/components/input-error';
import { ConfirmPopover } from '@/components/confirm-popover';
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
    eventStatuses,
    formatEventTime,
    parseWallClock,
} from '@/lib/event-dates';
import { formatCount } from '@/lib/dashboard';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { update as cancellation } from '@/routes/admin/events/cancellation';
import { index as registrations } from '@/routes/admin/events/registrations';
import { show as eventPage } from '@/routes/events';
import type { CalendarEvent, EventCategory, EventStatus } from '@/types';
import type { DirectoryOption } from '@/types/monitoring';

type AdminEvent = CalendarEvent & {
    /** Where it stands now. */
    status: EventStatus;
    created_by: string | null;
    /** Null: for every region. */
    region: DirectoryOption | null;
    /** Null for staff other than its region's CHED Focal and Administrators. */
    joined_count: number | null;
    /** Shown on the public website; deadlines never are. */
    is_public: boolean;
    /** Staff change their own region's events; every region's are the Central Office's. */
    can: { update: boolean; delete: boolean; viewRegistrations: boolean };
};

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

/** Where an event can be for: any region from the Central Office, otherwise the office's own. */
type Places = { regions: DirectoryOption[]; nationalAccess: boolean };

type EventForm = {
    title: string;
    category: EventCategory;
    /** The Central Office's pick; empty for every region. */
    region: string;
    /** On the public website's GAD events page and homepage. */
    is_public: boolean;
    is_all_day: boolean;
    starts_at: string;
    ends_at: string;
    /** Empty: open until the event ends. */
    registration_closes_at: string;
    location: string;
    description: string;
};

const dateFormat = new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

type Filters = { search: string; status: EventStatus | '' };

export default function EventsIndex({
    events,
    ongoing,
    categories,
    filters,
    regions,
    nationalAccess,
    permissions,
}: {
    events: PaginatedEvents;
    /** How many of the events listed are happening now. */
    ongoing: number;
    categories: EventCategory[];
    filters: Filters;
    permissions: Permissions;
} & Places) {
    const [search, setSearch] = useState(filters.search);
    const places = { regions, nationalAccess };

    function list(next: Filters) {
        router.get(
            '/admin/events',
            Object.fromEntries(
                Object.entries({ ...next, search: next.search.trim() }).filter(
                    ([, value]) => value,
                ),
            ),
            { preserveState: true, replace: true },
        );
    }

    function submitSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        list({ ...filters, search });
    }

    return (
        <>
            <Head title="GAD events" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-2xl font-medium">GAD events</h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Trainings, campaigns, meetings, and deadlines. HEI
                            users of the event&apos;s region, or of every
                            region, see them on their home calendar. Times are
                            Philippine time.
                        </p>
                    </div>
                    {permissions.create && (
                        <EventDialog
                            mode="create"
                            categories={categories}
                            {...places}
                        />
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
                                {ongoing > 0 && ` · ${ongoing} happening now`}
                            </CardDescription>
                        </div>
                        <form
                            className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap"
                            onSubmit={submitSearch}
                            role="search"
                        >
                            <Label htmlFor="event-status" className="sr-only">
                                Status
                            </Label>
                            <FormSelect
                                id="event-status"
                                value={filters.status}
                                onChange={(status) =>
                                    list({
                                        search,
                                        status: status as Filters['status'],
                                    })
                                }
                                placeholder="All events"
                                allowEmpty
                                emptyLabel="All events"
                                options={(
                                    Object.keys(eventStatuses) as EventStatus[]
                                ).map((status) => ({
                                    value: status,
                                    label: eventStatuses[status].label,
                                }))}
                                className="w-full rounded-[6px] data-[size=default]:h-11 sm:w-44"
                            />
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
                                className="min-w-0 flex-1 sm:w-64 sm:flex-none"
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
                                    {filters.search || filters.status
                                        ? 'No matching events'
                                        : 'No events yet'}
                                </h2>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    {filters.search || filters.status
                                        ? 'Try a different search term or status.'
                                        : 'Add the first event. It appears on the HEI home calendars of its region right away.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1080px] text-left text-sm">
                                    <caption className="sr-only">
                                        GAD events, newest first
                                    </caption>
                                    <thead className="border-b bg-muted/50 text-xs whitespace-nowrap text-muted-foreground">
                                        <tr>
                                            <th className="px-5 py-3 font-medium">
                                                Event
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                When
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Status
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Category
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                For
                                            </th>
                                            <th className="px-5 py-3 font-medium">
                                                Joined
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
                                                    <Link
                                                        href={eventPage(event)}
                                                        className="rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    >
                                                        {event.title}
                                                    </Link>
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
                                                <td className="px-5 py-4 whitespace-nowrap tabular-nums">
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
                                                    <EventStatusBadge
                                                        status={event.status}
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <EventCategoryLabel
                                                        category={
                                                            event.category
                                                        }
                                                        className="text-sm text-foreground"
                                                    />
                                                </td>
                                                <td className="px-5 py-4">
                                                    {event.region?.name ??
                                                        'All regions'}
                                                    {!event.is_public &&
                                                        event.category !==
                                                            'deadline' && (
                                                            <span className="mt-0.5 block text-xs text-muted-foreground">
                                                                Not on the
                                                                public site
                                                            </span>
                                                        )}
                                                </td>
                                                <td className="px-5 py-4 tabular-nums">
                                                    {/* For its region's CHED Focal and Administrators. */}
                                                    {event.category ===
                                                        'deadline' ||
                                                    event.joined_count ===
                                                        null ? (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            href={registrations.url(
                                                                event.id,
                                                            )}
                                                            aria-label={`See who joined ${event.title}: ${formatCount(event.joined_count)}`}
                                                            className="rounded-sm underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                        >
                                                            {formatCount(
                                                                event.joined_count,
                                                            )}
                                                        </Link>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-muted-foreground">
                                                    {event.created_by ?? '—'}
                                                </td>
                                                {(permissions.update ||
                                                    permissions.delete) && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-1">
                                                            {event.can
                                                                .update && (
                                                                <EventDialog
                                                                    mode="edit"
                                                                    event={
                                                                        event
                                                                    }
                                                                    categories={
                                                                        categories
                                                                    }
                                                                    {...places}
                                                                />
                                                            )}
                                                            {event.can
                                                                .update && (
                                                                <CancelEventButton
                                                                    event={
                                                                        event
                                                                    }
                                                                />
                                                            )}
                                                            {event.can
                                                                .delete && (
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
    regions,
    nationalAccess,
}: {
    mode: 'create' | 'edit';
    categories: EventCategory[];
    event?: AdminEvent;
} & Places) {
    const [open, setOpen] = useState(false);
    const id = `${mode}-${event?.id ?? 'new'}`;
    const form = useForm<EventForm>({
        title: event?.title ?? '',
        category: event?.category ?? 'training',
        is_public: event?.is_public ?? true,
        region: event?.region ? String(event.region.id) : '',
        is_all_day: event?.is_all_day ?? false,
        starts_at: toInputValue(
            event?.starts_at ?? null,
            event?.is_all_day ?? false,
        ),
        ends_at: toInputValue(
            event?.ends_at ?? null,
            event?.is_all_day ?? false,
        ),
        registration_closes_at: toInputValue(
            event?.registration_closes_at ?? null,
            false,
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

    // People on its list are told of a new date, time, venue or region
    // (docs/event-registration.md): say so before saving.
    const joined = event?.joined_count ?? 0;
    const changed = event
        ? [
              (form.data.starts_at !==
                  toInputValue(event.starts_at, event.is_all_day) ||
                  form.data.ends_at !==
                      toInputValue(event.ends_at, event.is_all_day) ||
                  form.data.is_all_day !== event.is_all_day) &&
                  'date and time',
              form.data.location.trim() !== (event.location ?? '') && 'venue',
              form.data.region !==
                  (event.region ? String(event.region.id) : '') && 'region',
          ].filter((change): change is string => change !== false)
        : [];

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
                        Enter Philippine time. HEI users of its region see the
                        event on their calendar as soon as it is saved.
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
                    {nationalAccess ? (
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-region`}>For</Label>
                            <FormSelect
                                id={`${id}-region`}
                                value={form.data.region}
                                onChange={(region) =>
                                    form.setData('region', region)
                                }
                                placeholder="All regions"
                                allowEmpty
                                emptyLabel="All regions"
                                options={regions.map((region) => ({
                                    value: String(region.id),
                                    label: region.name,
                                }))}
                                className="rounded-[6px] data-[size=default]:h-11"
                            />
                            <InputError message={form.errors.region} />
                        </div>
                    ) : (
                        regions[0] && (
                            <p className="text-sm text-muted-foreground">
                                For HEIs of{' '}
                                <span className="font-medium text-foreground">
                                    {regions[0].name}
                                </span>
                                .
                            </p>
                        )
                    )}
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
                    {form.data.category !== 'deadline' && (
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-registration`}>
                                Registration closes (optional)
                            </Label>
                            <Input
                                id={`${id}-registration`}
                                type="datetime-local"
                                value={form.data.registration_closes_at}
                                max={
                                    form.data.ends_at
                                        ? form.data.is_all_day
                                            ? `${form.data.ends_at.slice(0, 10)}T23:59`
                                            : form.data.ends_at
                                        : undefined
                                }
                                onChange={(e) =>
                                    form.setData(
                                        'registration_closes_at',
                                        e.target.value,
                                    )
                                }
                                aria-describedby={`${id}-registration-help`}
                            />
                            <p
                                id={`${id}-registration-help`}
                                className="text-[13px] text-muted-foreground"
                            >
                                When people can no longer join. Empty: open
                                until the event ends. Only people who join can
                                be checked in.
                            </p>
                            <InputError
                                message={form.errors.registration_closes_at}
                            />
                        </div>
                    )}
                    {/* Deadlines are for HEIs alone, never on the public site. */}
                    {form.data.category !== 'deadline' && (
                        <div className="grid gap-1.5">
                            <label className="flex cursor-pointer items-center gap-3 text-sm">
                                <Checkbox
                                    checked={form.data.is_public}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_public',
                                            checked === true,
                                        )
                                    }
                                    aria-describedby={`${id}-public-help`}
                                />
                                Show on the public website
                            </label>
                            <p
                                id={`${id}-public-help`}
                                className="pl-7 text-[13px] text-muted-foreground"
                            >
                                Anyone can see it on the public GAD events page
                                and the homepage. Turn this off for an internal
                                meeting.
                            </p>
                            <InputError message={form.errors.is_public} />
                        </div>
                    )}
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
                    {joined > 0 && changed.length > 0 && (
                        <p
                            role="status"
                            className={cn(
                                'rounded-lg px-3 py-2 text-sm',
                                tones.warning.badge,
                            )}
                        >
                            {people(joined)} joined. They stay on the list and
                            will be told of the new {changed.join(' and ')}.
                        </p>
                    )}
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

/** "3 people", for what the people who joined are told. */
function people(count: number): string {
    return count === 1 ? '1 person' : `${formatCount(count)} people`;
}

/**
 * Calling it off keeps its list, and everyone on it is told; putting it
 * back on needs no confirmation.
 */
function CancelEventButton({ event }: { event: AdminEvent }) {
    if (event.cancelled) {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                    router.put(
                        cancellation.url(event.id),
                        { cancelled: false },
                        { preserveScroll: true },
                    )
                }
            >
                <RotateCcw />
                <span className="sr-only">Restore {event.title}</span>
            </Button>
        );
    }

    const told = event.joined_count
        ? ` The ${people(event.joined_count)} who joined will be told.`
        : '';

    return (
        <ConfirmPopover
            title="Cancel this event?"
            description={`Its list stays, and nobody can join or be checked in.${told} You can restore it later.`}
            confirmLabel="Cancel event"
            onConfirm={(visit) =>
                router.put(
                    cancellation.url(event.id),
                    { cancelled: true },
                    { preserveScroll: true, ...visit },
                )
            }
        >
            <Button variant="ghost" size="icon">
                <Ban />
                <span className="sr-only">Cancel {event.title}</span>
            </Button>
        </ConfirmPopover>
    );
}

function DeleteEventDialog({ event }: { event: AdminEvent }) {
    const told = event.joined_count
        ? ` The ${people(event.joined_count)} who joined will be told it is off.`
        : '';

    return (
        <ConfirmPopover
            title="Delete this event?"
            description={`“${event.title}” will be removed from HEI calendars.${told}`}
            confirmLabel="Delete event"
            onConfirm={(visit) =>
                router.delete(`/admin/events/${event.id}`, {
                    preserveScroll: true,
                    ...visit,
                })
            }
        >
            <Button variant="ghost" size="icon">
                <Trash2 />
                <span className="sr-only">Delete {event.title}</span>
            </Button>
        </ConfirmPopover>
    );
}

EventsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Events', href: '/admin/events' },
    ],
};
