import { useForm } from '@inertiajs/react';
import { Check, Search, UserPlus } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { DayCheckboxes } from '@/components/events/day-checkboxes';
import InputError from '@/components/input-error';
import { fieldClass } from '@/components/monitoring/shared';
import { PersonAvatar } from '@/components/person-avatar';
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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { people as peopleRoute } from '@/routes/admin/events';
import { store } from '@/routes/admin/events/registrations';
import type { EventDetail } from '@/types/events';

/** `PersonResource`, as the event's people search sends it. */
type Person = {
    ulid: string;
    name: string;
    avatar: string | null;
    affiliation: string | null;
};

/** Shortest search the server runs (PeopleSearchRequest::MIN_LENGTH). */
const MIN_SEARCH = 2;

/**
 * Adding someone with an account to an event's list
 * (docs/event-registration.md): an invitee from any region, or a walk-in
 * from the paper sheet with the days they came. They are told, and the
 * event shows on their calendar.
 */
export function AddPersonDialog({
    event,
    days,
}: {
    event: EventDetail;
    /** The days that may be marked, Y-m-d. */
    days: string[];
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [people, setPeople] = useState<Person[] | null>([]);
    const [failed, setFailed] = useState(false);
    const [chosen, setChosen] = useState<Person | null>(null);
    const form = useForm<{ person: string; days: string[] }>({
        person: '',
        days: [],
    });
    const term = query.trim();
    // Refusals for the event itself (a deadline, a cancelled event) come on `registration`.
    const errors = form.errors as Partial<
        Record<'person' | 'days' | 'registration', string>
    >;

    useEffect(() => {
        if (!open || term.length < MIN_SEARCH) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setPeople(null);

            try {
                const response = await fetch(
                    peopleRoute.url(event.id, { query: { q: term } }),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                        credentials: 'same-origin',
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                setPeople(((await response.json()) as { data: Person[] }).data);
                setFailed(false);
            } catch {
                if (!controller.signal.aborted) {
                    setFailed(true);
                }
            }
        }, 250);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, term, event.id]);

    function choose(person: Person) {
        setChosen(person);
        form.setData('person', person.ulid);
    }

    function reset() {
        setChosen(null);
        setQuery('');
        setPeople([]);
        form.reset();
        form.clearErrors();
    }

    function submit(submitEvent: FormEvent<HTMLFormElement>) {
        submitEvent.preventDefault();
        form.post(store.url(event.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    reset();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserPlus />
                    Add people
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add someone to {event.title}</DialogTitle>
                    <DialogDescription>
                        Anyone with a PHLGADIS account, from any region, such as
                        an invitee or a walk-in from the paper sheet. They are
                        told, and the event shows on their calendar.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit} noValidate>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-search`}>Who</Label>
                        <div className="relative">
                            <Search
                                aria-hidden
                                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                id={`${id}-search`}
                                type="search"
                                autoComplete="off"
                                placeholder="Search by name or institution"
                                className={cn(fieldClass, 'pl-9')}
                                value={query}
                                onChange={(changeEvent) =>
                                    setQuery(changeEvent.target.value)
                                }
                                aria-controls={`${id}-people`}
                            />
                        </div>
                        <ul
                            id={`${id}-people`}
                            aria-label="People"
                            aria-busy={people === null}
                            className="max-h-64 overflow-y-auto rounded-lg border"
                        >
                            {term.length < MIN_SEARCH ? (
                                <li className="px-3 py-4 text-sm text-muted-foreground">
                                    Type at least two letters of their name or
                                    institution.
                                </li>
                            ) : failed ? (
                                <li className="px-3 py-4 text-sm text-destructive">
                                    The list could not load. Try typing again.
                                </li>
                            ) : people === null ? (
                                <li className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                                    <Spinner />
                                    Searching
                                </li>
                            ) : people.length === 0 ? (
                                <li className="px-3 py-4 text-sm text-muted-foreground">
                                    Nobody matches, or they are on the list
                                    already. Someone without an account can be
                                    added as a guest.
                                </li>
                            ) : (
                                people.map((person) => {
                                    const selected =
                                        chosen?.ulid === person.ulid;

                                    return (
                                        <li key={person.ulid}>
                                            <button
                                                type="button"
                                                aria-pressed={selected}
                                                onClick={() => choose(person)}
                                                className={cn(
                                                    'flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                                                    selected &&
                                                        'bg-brand-soft hover:bg-brand-soft',
                                                )}
                                            >
                                                <PersonAvatar
                                                    name={person.name}
                                                    src={person.avatar}
                                                    className="size-8"
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium">
                                                        {person.name}
                                                    </span>
                                                    <span className="block truncate text-[13px] text-muted-foreground">
                                                        {person.affiliation}
                                                    </span>
                                                </span>
                                                {selected && (
                                                    <Check
                                                        aria-hidden
                                                        className="size-4 text-brand"
                                                    />
                                                )}
                                            </button>
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                        <InputError message={errors.person} />
                    </div>
                    <DayCheckboxes
                        id={`${id}-days`}
                        days={days}
                        value={form.data.days}
                        onChange={(marked) => form.setData('days', marked)}
                        error={errors.days ?? errors.registration}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing || chosen === null}
                        >
                            {form.processing && <Spinner />}
                            {chosen ? `Add ${chosen.name}` : 'Add'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
