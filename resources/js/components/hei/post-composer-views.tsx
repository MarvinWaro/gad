import { ArrowUpRight, Check, ImagePlus, Search, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { AgendaTile, SdgCredit } from '@/components/hei/post-goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { PersonAvatar } from '@/components/person-avatar';
import { achieveAgenda, achievePage, type AchieveCode } from '@/data/achieve';
import { sdgsFor, sustainableGoals } from '@/data/sdgs';
import { POST_FEELINGS } from '@/lib/post-feelings';
import { MAX_ACHIEVE_ITEMS, MAX_SDGS, sdgLabel } from '@/lib/post-goals';
import { cn } from '@/lib/utils';
import type { TaggedUser } from '@/types';

/** CHED staff have no school; this is what stands in for one. */
export const CHED_LABEL = 'CHED Regional Office XII';

function SearchField({
    value,
    onChange,
    placeholder,
    label,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    label: string;
}) {
    return (
        <div className="relative">
            <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={label}
                autoFocus
                className="h-10 rounded-[10px] pl-9 caret-brand"
            />
        </div>
    );
}

/** The round check at the end of a pickable row. */
function SelectionMark({ selected }: { selected: boolean }) {
    return (
        <span
            aria-hidden
            className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150',
                selected && 'border-primary bg-primary text-primary-foreground',
            )}
        >
            {selected && <Check className="size-3.5" />}
        </span>
    );
}

type SearchResult = { query: string; people: TaggedUser[] };

/**
 * Search active accounts by name or school and toggle who is tagged. The
 * server only ever offers approved, active people (never the author).
 */
export function TagPeopleView({
    selected,
    onToggle,
    max,
}: {
    selected: TaggedUser[];
    onToggle: (person: TaggedUser) => void;
    max: number;
}) {
    const listId = useId();
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<SearchResult | null>(null);
    const [failedQuery, setFailedQuery] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);
    const term = query.trim();

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(
            async () => {
                try {
                    const response = await fetch(
                        `/posts/tag-suggestions?q=${encodeURIComponent(term)}`,
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

                    setResult({ query: term, people: await response.json() });
                    setFailedQuery(null);
                } catch {
                    if (!controller.signal.aborted) {
                        setFailedQuery(term);
                    }
                }
            },
            term === '' ? 0 : 250,
        );

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [term, attempt]);

    const failed = failedQuery === term;
    const loading = !failed && result?.query !== term;
    const people = result?.people ?? [];
    const selectedIds = new Set(selected.map((person) => person.id));
    const full = selected.length >= max;

    return (
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
            <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search by name or school"
                label="Search people by name or school"
            />

            {selected.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground">
                        Tagged ({selected.length}/{max})
                    </p>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {selected.map((person) => (
                            <li key={person.id}>
                                <button
                                    type="button"
                                    onClick={() => onToggle(person)}
                                    className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 pr-1.5 pl-2.5 text-sm text-brand outline-none hover:bg-brand-soft/70 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    {person.name}
                                    <X aria-hidden className="size-3.5" />
                                    <span className="sr-only">
                                        {' '}
                                        (remove tag)
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="-mx-2 min-h-48" aria-busy={loading}>
                {failed ? (
                    <div className="flex flex-col items-center gap-3 px-2 py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            Could not load people. Check your connection and try
                            again.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAttempt((value) => value + 1)}
                        >
                            Try again
                        </Button>
                    </div>
                ) : loading && people.length === 0 ? (
                    <ul aria-hidden className="space-y-1 px-2">
                        {[0, 1, 2, 3].map((row) => (
                            <li
                                key={row}
                                className="flex items-center gap-3 py-2"
                            >
                                <Skeleton className="size-9 rounded-full" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-2/5" />
                                    <Skeleton className="h-3 w-3/5" />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : people.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                        {term === ''
                            ? 'No other active accounts yet.'
                            : `No active account matches “${term}”.`}
                    </p>
                ) : (
                    <ul
                        id={listId}
                        aria-label="People you can tag"
                        className={cn(
                            'space-y-0.5 transition-opacity duration-150',
                            loading && 'opacity-60',
                        )}
                    >
                        {people.map((person) => {
                            const isSelected = selectedIds.has(person.id);

                            return (
                                <li key={person.id}>
                                    <button
                                        type="button"
                                        aria-pressed={isSelected}
                                        disabled={!isSelected && full}
                                        onClick={() => onToggle(person)}
                                        className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
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
                                                {person.hei ?? CHED_LABEL}
                                            </span>
                                        </span>
                                        <SelectionMark selected={isSelected} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {full && (
                <p className="text-xs text-muted-foreground" aria-live="polite">
                    You can tag up to {max} people.
                </p>
            )}
        </div>
    );
}

/** Pick one feeling (or none); picking returns to the post. */
export function FeelingView({
    value,
    onPick,
}: {
    value: string;
    onPick: (value: string) => void;
}) {
    const [filter, setFilter] = useState('');
    const term = filter.trim().toLowerCase();
    const feelings = POST_FEELINGS.filter((feeling) =>
        feeling.label.includes(term),
    );

    return (
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
            <SearchField
                value={filter}
                onChange={setFilter}
                placeholder="Search feelings"
                label="Search feelings"
            />

            {value !== '' && (
                <button
                    type="button"
                    onClick={() => onPick('')}
                    className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <X aria-hidden className="size-4" />
                    No feeling
                </button>
            )}

            {feelings.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No feeling matches “{filter.trim()}”.
                </p>
            ) : (
                <ul className="grid grid-cols-2 gap-1">
                    {feelings.map((feeling) => {
                        const isSelected = feeling.value === value;

                        return (
                            <li key={feeling.value}>
                                <button
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => onPick(feeling.value)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                        isSelected && 'bg-muted font-medium',
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-lg"
                                    >
                                        {feeling.emoji}
                                    </span>
                                    <span className="flex-1">
                                        {feeling.label}
                                    </span>
                                    {isSelected && (
                                        <Check
                                            aria-hidden
                                            className="size-4 text-brand"
                                        />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

/** Every photo on the post, each removable, with room to add more. */
export function PhotosView({
    previews,
    max,
    onRemove,
    onAdd,
}: {
    previews: string[];
    max: number;
    onRemove: (index: number) => void;
    onAdd: () => void;
}) {
    return (
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
            <ul className="grid grid-cols-3 gap-2">
                {previews.map((url, index) => (
                    <li
                        key={url}
                        className="relative aspect-square overflow-hidden rounded-[10px] border bg-muted"
                    >
                        <img
                            src={url}
                            alt={`Photo ${index + 1} to post`}
                            className="size-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.2)] outline-none hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/60"
                        >
                            <X aria-hidden className="size-4" />
                            <span className="sr-only">
                                Remove photo {index + 1}
                            </span>
                        </button>
                    </li>
                ))}
                {previews.length < max && (
                    <li className="aspect-square">
                        <button
                            type="button"
                            onClick={onAdd}
                            className="flex size-full flex-col items-center justify-center gap-1.5 rounded-[10px] border border-dashed text-sm text-muted-foreground outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <ImagePlus aria-hidden className="size-5" />
                            Add photos
                        </button>
                    </li>
                )}
            </ul>
            <p className="text-xs text-muted-foreground tabular-nums">
                {previews.length} of {max} photos · JPG, PNG, or WebP, up to 5
                MB each
            </p>
        </div>
    );
}

/**
 * Pick the SDGs and A.C.H.I.E.V.E. items the activity supports, up to three
 * of each. The SDG icons stay whole, square, uncovered and in their own
 * colours, as the UN's guidelines ask: a picked icon gets a frame outside its
 * edge, and once three are picked the others stop responding rather than
 * fading.
 */
export function GoalsView({
    sdgs,
    achieveItems,
    onToggleSdg,
    onToggleAchieve,
}: {
    sdgs: number[];
    achieveItems: AchieveCode[];
    onToggleSdg: (goal: number) => void;
    onToggleAchieve: (code: AchieveCode) => void;
}) {
    const sdgHeading = useId();
    const agendaHeading = useId();
    const picked = sdgsFor(sdgs);
    const sdgsFull = sdgs.length >= MAX_SDGS;
    const agendaFull = achieveItems.length >= MAX_ACHIEVE_ITEMS;

    return (
        <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-4">
            <section aria-labelledby={sdgHeading} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                    <h3 id={sdgHeading} className="text-sm font-medium">
                        Sustainable Development Goals
                    </h3>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {sdgs.length}/{MAX_SDGS}
                    </span>
                </div>
                <ul className="grid grid-cols-4 gap-4 sm:grid-cols-6">
                    {sustainableGoals.map((goal) => {
                        const isPicked = sdgs.includes(goal.number);
                        const blocked = !isPicked && sdgsFull;

                        return (
                            <li key={goal.number}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            aria-pressed={isPicked}
                                            aria-disabled={blocked || undefined}
                                            onClick={() => {
                                                if (!blocked) {
                                                    onToggleSdg(goal.number);
                                                }
                                            }}
                                            // The focus ring hugs the icon
                                            // and the picked frame sits
                                            // just beyond it, so both show.
                                            className={cn(
                                                'block w-full outline-[3px] outline-offset-[3px] outline-transparent transition-[outline-color] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                                isPicked && 'outline-brand',
                                                blocked && 'cursor-not-allowed',
                                            )}
                                        >
                                            <img
                                                src={goal.image}
                                                alt=""
                                                width={320}
                                                height={320}
                                                loading="lazy"
                                                decoding="async"
                                                className="block aspect-square w-full"
                                            />
                                            <span className="sr-only">
                                                {sdgLabel(goal)}
                                            </span>
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {sdgLabel(goal)}
                                    </TooltipContent>
                                </Tooltip>
                            </li>
                        );
                    })}
                </ul>
                <p aria-live="polite" className="text-xs text-muted-foreground">
                    {picked.length === 0
                        ? `Pick up to ${MAX_SDGS} goals this activity supports.`
                        : `Picked: ${picked.map(sdgLabel).join('; ')}.`}
                    {sdgsFull &&
                        ` You can pick up to ${MAX_SDGS} SDGs. Remove one to pick another.`}
                </p>
                <SdgCredit />
            </section>

            <section aria-labelledby={agendaHeading} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                    <h3 id={agendaHeading} className="text-sm font-medium">
                        A.C.H.I.E.V.E. Agenda
                    </h3>
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {achieveItems.length}/{MAX_ACHIEVE_ITEMS}
                    </span>
                </div>
                <ul className="-mx-2 space-y-0.5">
                    {achieveAgenda.map((item) => {
                        const isPicked = achieveItems.includes(item.code);

                        return (
                            <li key={item.code}>
                                <button
                                    type="button"
                                    aria-pressed={isPicked}
                                    disabled={!isPicked && agendaFull}
                                    onClick={() => onToggleAchieve(item.code)}
                                    className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <AgendaTile
                                        item={item}
                                        className="size-9 text-base"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-medium">
                                            {item.title}
                                        </span>
                                        <span className="block text-xs text-muted-foreground capitalize">
                                            {item.role}
                                        </span>
                                    </span>
                                    <SelectionMark selected={isPicked} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
                {agendaFull && (
                    <p
                        className="text-xs text-muted-foreground"
                        aria-live="polite"
                    >
                        You can pick up to {MAX_ACHIEVE_ITEMS} A.C.H.I.E.V.E.
                        items.
                    </p>
                )}
                <a
                    href={achievePage}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    About the agenda
                    <ArrowUpRight aria-hidden className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                </a>
            </section>
        </div>
    );
}
