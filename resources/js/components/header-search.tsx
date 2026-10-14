import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { type KeyboardEvent, useId, useState } from 'react';
import { IconAction } from '@/components/icon-action';
import { PersonAvatar } from '@/components/person-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { usePeopleSearch } from '@/hooks/use-people-search';
import { cn } from '@/lib/utils';
import { search as searchPage } from '@/routes';
import { show as profile } from '@/routes/people';
import type { Person } from '@/types/people';

const label = 'Search PHLGADIS';

/** A suggestion: a person, or the full results page. */
type Option = { href: string; person: Person | null };

/**
 * Where the search sits: the top header, from its left (a field from
 * 768px), or the sidebar layout's top bar, at its right end (a field from
 * 1024px, beside the breadcrumbs). Narrower, an icon opens it.
 */
const placements = {
    header: { field: 'hidden md:block', icon: 'md:hidden', align: 'start' },
    sidebar: { field: 'hidden lg:block', icon: 'lg:hidden', align: 'end' },
} as const;

/**
 * The header's search, as on Facebook: a field beside the icon, or an icon
 * that opens it on narrow screens. It finds people by name or institution
 * as the reader types (App\Support\PeopleSearch); Enter, or the last
 * suggestion, opens every result.
 */
export function HeaderSearch({
    placement = 'header',
}: {
    placement?: keyof typeof placements;
}) {
    const { field, icon, align } = placements[placement];

    return (
        <>
            <div className={cn('relative', field)}>
                <PeopleSearchBox
                    floating
                    align={align}
                    className="w-56 xl:w-64"
                />
            </div>
            <CompactSearch align={align} className={icon} />
        </>
    );
}

function CompactSearch({
    align,
    className,
}: {
    align: 'start' | 'end';
    className: string;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <IconAction
                    label={label}
                    side="bottom"
                    className={cn(
                        'size-10 text-muted-foreground hover:text-foreground',
                        className,
                    )}
                >
                    <Search className="size-5" />
                </IconAction>
            </PopoverTrigger>
            <PopoverContent
                align={align}
                className="w-[calc(100vw-2rem)] max-w-sm p-3"
            >
                <PeopleSearchBox autoFocus onNavigate={() => setOpen(false)} />
            </PopoverContent>
        </Popover>
    );
}

/**
 * A combobox (WAI-ARIA's list autocomplete): the field keeps focus while the
 * arrow keys move through the people found. `floating` shows them in a
 * panel under the field while it has focus; otherwise they sit below it.
 */
function PeopleSearchBox({
    floating = false,
    align = 'start',
    autoFocus = false,
    className,
    onNavigate,
}: {
    floating?: boolean;
    align?: 'start' | 'end';
    autoFocus?: boolean;
    className?: string;
    /** Called as a suggestion opens, such as to close the popover. */
    onNavigate?: () => void;
}) {
    const id = useId();
    const listId = `${id}-list`;
    const hintId = `${id}-hint`;
    const [text, setText] = useState('');
    const [focused, setFocused] = useState(false);
    const [active, setActive] = useState(-1);
    const { search, ready, people, failed } = usePeopleSearch(text);
    const resultsHref = searchPage.url({ query: { q: search } });
    const options: Option[] = people?.length
        ? [
              ...people.map((person) => ({
                  href: profile.url(person.ulid),
                  person,
              })),
              { href: resultsHref, person: null },
          ]
        : [];
    const current = active < options.length ? active : -1;
    const open = !floating || focused;
    const listed = open && options.length > 0;

    function go(href: string) {
        setFocused(false);
        setActive(-1);
        onNavigate?.();
        router.visit(href);
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        const count = options.length;

        if (event.key === 'ArrowDown' && count > 0) {
            event.preventDefault();
            setFocused(true);
            setActive((index) => (index + 1) % count);
        } else if (event.key === 'ArrowUp' && count > 0) {
            event.preventDefault();
            setActive((index) => (index <= 0 ? count - 1 : index - 1));
        } else if (event.key === 'Enter') {
            event.preventDefault();

            if (current >= 0) {
                go(options[current].href);
            } else if (ready) {
                go(resultsHref);
            }
        } else if (event.key === 'Escape' && floating && focused) {
            event.preventDefault();
            setFocused(false);
            setActive(-1);
        }
    }

    return (
        <form
            role="search"
            aria-label="People"
            onSubmit={(event) => event.preventDefault()}
            className={cn('relative', !floating && 'space-y-2', className)}
        >
            <div className="relative">
                <Search
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                    type="search"
                    role="combobox"
                    aria-label={label}
                    aria-describedby={hintId}
                    aria-autocomplete="list"
                    aria-expanded={listed}
                    aria-controls={listed ? listId : undefined}
                    aria-activedescendant={
                        listed && current >= 0
                            ? `${id}-option-${current}`
                            : undefined
                    }
                    placeholder={label}
                    autoComplete="off"
                    autoFocus={autoFocus}
                    value={text}
                    onChange={(event) => {
                        setText(event.target.value);
                        setActive(-1);
                        setFocused(true);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onKeyDown={onKeyDown}
                    className="h-10 w-full rounded-[10px] bg-muted pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:text-sm"
                />
            </div>

            {/* The hint stays in the page while closed, so screen readers
                hear it with the field. */}
            <div
                hidden={!open}
                className={cn(
                    floating &&
                        'absolute top-full z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border bg-popover p-2 text-popover-foreground shadow-md',
                    floating && (align === 'end' ? 'right-0' : 'left-0'),
                )}
            >
                <p
                    id={hintId}
                    hidden={ready}
                    className="px-2 py-1.5 text-sm text-muted-foreground"
                >
                    Search people by name or institution.
                </p>
                {ready && (
                    <Suggestions
                        id={id}
                        listId={listId}
                        search={search}
                        people={people}
                        failed={failed}
                        options={options}
                        current={current}
                        onHover={setActive}
                        onChoose={go}
                    />
                )}
            </div>
        </form>
    );
}

function Suggestions({
    id,
    listId,
    search,
    people,
    failed,
    options,
    current,
    onHover,
    onChoose,
}: {
    id: string;
    listId: string;
    search: string;
    people: Person[] | null;
    failed: boolean;
    options: Option[];
    current: number;
    onHover: (index: number) => void;
    onChoose: (href: string) => void;
}) {
    const found =
        people === null
            ? ''
            : people.length === 0
              ? `No one found for ${search}.`
              : `${people.length} ${people.length === 1 ? 'person' : 'people'} found. Use the arrow keys to choose.`;

    return (
        <>
            <p role="status" className="sr-only">
                {failed ? 'Search is not available right now.' : found}
            </p>
            {failed ? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    Search is not available right now. Check your connection and
                    try again.
                </p>
            ) : people === null ? (
                <ul aria-hidden className="space-y-1">
                    {[0, 1, 2].map((row) => (
                        <li
                            key={row}
                            className="flex items-center gap-3 px-2 py-1.5"
                        >
                            <Skeleton className="size-9 rounded-full" />
                            <div className="flex-1 space-y-1.5">
                                <Skeleton className="h-3.5 w-1/2" />
                                <Skeleton className="h-3 w-2/3" />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : people.length === 0 ? (
                <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium">No one found for “{search}”</p>
                    <p className="mt-0.5 text-muted-foreground">
                        Check the spelling, or try part of a name.
                    </p>
                </div>
            ) : (
                <ul id={listId} role="listbox" aria-label="People">
                    {options.map((option, index) => (
                        <li
                            key={option.person?.id ?? 'all'}
                            id={`${id}-option-${index}`}
                            role="option"
                            aria-selected={index === current}
                            // Keeps focus in the field, so the click lands.
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseMove={() => onHover(index)}
                            onClick={() => onChoose(option.href)}
                            className={cn(
                                'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5',
                                index === current && 'bg-muted',
                                option.person === null && 'mt-1 border-t pt-2',
                            )}
                        >
                            {option.person ? (
                                <PersonOption person={option.person} />
                            ) : (
                                <>
                                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                                        <Search
                                            aria-hidden
                                            className="size-4 text-muted-foreground"
                                        />
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-sm">
                                        See all results for “{search}”
                                    </span>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

function PersonOption({ person }: { person: Person }) {
    const note = person.is_you ? 'You' : person.following ? 'Following' : null;

    return (
        <>
            <PersonAvatar
                name={person.name}
                src={person.avatar}
                className="size-9"
            />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                    {person.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                    {person.affiliation}
                </span>
            </span>
            {note && (
                <span className="shrink-0 text-xs text-muted-foreground">
                    {note}
                </span>
            )}
        </>
    );
}
