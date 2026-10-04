import { useForm } from '@inertiajs/react';
import { Award, Check, Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
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
import { people as peopleRoute } from '@/routes/settings/badges';
import { store } from '@/routes/settings/badges/awards';
import type { BadgeRow } from '@/types/badges';

type Person = {
    id: number;
    name: string;
    avatar: string | null;
    place: string;
};

/**
 * Awarding a custom badge by hand: find the person by name or institution
 * (only people of the badge's region who do not hold it yet are offered),
 * say what for, then Award.
 */
export function AwardDialog({ badge }: { badge: BadgeRow }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [people, setPeople] = useState<Person[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [chosen, setChosen] = useState<Person | null>(null);
    const form = useForm({ user: '', note: '' });
    const term = query.trim();

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(
            async () => {
                try {
                    const response = await fetch(
                        peopleRoute.url(badge.id, { query: { q: term } }),
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

                    setPeople(await response.json());
                    setFailed(false);
                } catch {
                    if (!controller.signal.aborted) {
                        setFailed(true);
                    }
                }
            },
            term === '' ? 0 : 250,
        );

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, term, badge.id]);

    function choose(person: Person) {
        setChosen(person);
        form.setData('user', String(person.id));
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.post(store.url(badge.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setChosen(null);
                setQuery('');
                form.reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Award />
                    Award
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Award {badge.name}</DialogTitle>
                    <DialogDescription>
                        {badge.region
                            ? `Only people of ${badge.region.name} can receive it.`
                            : 'People of any region can receive it.'}{' '}
                        They are told in their notifications, and it shows on
                        their profile.
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
                                onChange={(event) =>
                                    setQuery(event.target.value)
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
                            {failed ? (
                                <li className="px-3 py-4 text-sm text-destructive">
                                    The list could not load. Try typing again.
                                </li>
                            ) : people === null ? (
                                <li className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                                    <Spinner />
                                    Loading people
                                </li>
                            ) : people.length === 0 ? (
                                <li className="px-3 py-4 text-sm text-muted-foreground">
                                    {term
                                        ? 'Nobody matches, or they already hold it.'
                                        : 'Everyone who could receive it already holds it.'}
                                </li>
                            ) : (
                                people.map((person) => {
                                    const selected = chosen?.id === person.id;

                                    return (
                                        <li key={person.id}>
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
                                                        {person.place}
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
                        <InputError message={form.errors.user} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-note`}>
                            What for (optional)
                        </Label>
                        <input
                            id={`${id}-note`}
                            className={fieldClass}
                            value={form.data.note}
                            onChange={(event) =>
                                form.setData('note', event.target.value)
                            }
                            maxLength={200}
                            placeholder="For example, speaker at the Women's Month forum"
                        />
                        <InputError message={form.errors.note} />
                    </div>
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
                            {chosen ? `Award to ${chosen.name}` : 'Award'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
