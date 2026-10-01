import { Heart, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent, RefObject } from 'react';
import { PersonAvatar } from '@/components/person-avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverAnchor,
    PopoverContent,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CHED_LABEL } from '@/lib/ched-label';
import {
    POST_REACTIONS,
    reactionOption,
    reactionsLabel,
    usedReactions,
} from '@/lib/post-reactions';
import { underlineTabs } from '@/lib/underline-tabs';
import { cn } from '@/lib/utils';
import type { PostReactionType, ReactionSummary, Reactor } from '@/types';

/** How long the mouse rests on React before the picker opens, in ms. */
const HOVER_OPEN_DELAY = 450;
/** Time to cross from the button to the picker before it closes, in ms. */
const HOVER_CLOSE_DELAY = 300;
/** How long a finger holds React to open the picker, in ms. */
const LONG_PRESS_DELAY = 400;
/** How far a finger may drift before a hold counts as a scroll, in px. */
const PRESS_SLOP = 10;

/** The picker's emoji pop in one after another. */
const POP_DELAYS = [
    '',
    'motion-safe:[animation-delay:60ms]',
    'motion-safe:[animation-delay:120ms]',
];

/**
 * React: a click or tap gives a Heart, or takes the viewer's reaction back.
 * Resting the mouse on it, holding it on a touch screen, or pressing the up
 * arrow opens the picker with every reaction.
 */
export function ReactionButton({
    mine,
    onReact,
    className,
}: {
    mine: PostReactionType | null;
    onReact: (type: PostReactionType | null) => void;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    // Opened with the keyboard: focus moves into the picker and back.
    const [fromKeyboard, setFromKeyboard] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const timer = useRef<number | undefined>(undefined);
    const pressStart = useRef<{ x: number; y: number } | null>(null);
    // The hold already opened the picker, so the click after it must not react.
    const longPressed = useRef(false);
    const hintId = useId();
    const chosen = mine ? reactionOption(mine) : null;

    useEffect(() => () => window.clearTimeout(timer.current), []);

    function after(delay: number, action: () => void) {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(action, delay);
    }

    function openPicker(keyboard: boolean) {
        window.clearTimeout(timer.current);
        setFromKeyboard(keyboard);
        setOpen(true);
    }

    function closePicker() {
        window.clearTimeout(timer.current);
        setOpen(false);
    }

    function toggle() {
        if (longPressed.current) {
            longPressed.current = false;

            return;
        }

        closePicker();
        onReact(mine ? null : 'heart');
    }

    function choose(type: PostReactionType) {
        closePicker();

        if (type !== mine) {
            onReact(type);
        }
    }

    function startPress(event: PointerEvent<HTMLButtonElement>) {
        if (event.pointerType === 'mouse') {
            return;
        }

        longPressed.current = false;
        pressStart.current = { x: event.clientX, y: event.clientY };
        after(LONG_PRESS_DELAY, () => {
            pressStart.current = null;
            longPressed.current = true;
            openPicker(false);
        });
    }

    function trackPress(event: PointerEvent<HTMLButtonElement>) {
        const start = pressStart.current;

        if (
            start &&
            Math.hypot(event.clientX - start.x, event.clientY - start.y) >
                PRESS_SLOP
        ) {
            endPress();
        }
    }

    function endPress() {
        if (pressStart.current) {
            pressStart.current = null;
            window.clearTimeout(timer.current);
        }
    }

    return (
        <Popover open={open} onOpenChange={(next) => !next && closePicker()}>
            <PopoverAnchor asChild>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={toggle}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            openPicker(true);
                        }
                    }}
                    onPointerEnter={(event) => {
                        if (event.pointerType === 'mouse') {
                            after(HOVER_OPEN_DELAY, () => openPicker(false));
                        }
                    }}
                    onPointerLeave={(event) => {
                        if (event.pointerType === 'mouse') {
                            after(HOVER_CLOSE_DELAY, closePicker);
                        }
                    }}
                    onPointerDown={startPress}
                    onPointerMove={trackPress}
                    onPointerUp={endPress}
                    onPointerCancel={endPress}
                    onContextMenu={(event) => {
                        // A held finger opens the picker, not the page menu.
                        if (pressStart.current || longPressed.current) {
                            event.preventDefault();
                        }
                    }}
                    aria-label={
                        chosen
                            ? `Remove your ${chosen.label} reaction`
                            : 'React with Heart'
                    }
                    aria-describedby={hintId}
                    aria-keyshortcuts="ArrowUp"
                    className={cn(
                        className,
                        'touch-manipulation select-none [-webkit-touch-callout:none]',
                        chosen
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {chosen ? (
                        <span
                            key={chosen.value}
                            aria-hidden
                            className="text-lg leading-none motion-safe:animate-in motion-safe:ease-out motion-safe:animation-duration-300 motion-safe:zoom-in-50"
                        >
                            {chosen.emoji}
                        </span>
                    ) : (
                        <Heart aria-hidden className="size-4.5" />
                    )}
                </button>
            </PopoverAnchor>
            <span id={hintId} className="sr-only">
                Press the up arrow key to choose another reaction.
            </span>
            <PopoverContent
                side="top"
                align="start"
                sideOffset={6}
                collisionPadding={8}
                className="w-auto rounded-full p-1 shadow-lg"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();

                    // From the keyboard, start on the viewer's reaction.
                    if (fromKeyboard) {
                        const picker = pickerRef.current;
                        (
                            picker?.querySelector<HTMLButtonElement>(
                                '[aria-pressed="true"]',
                            ) ?? picker?.querySelector('button')
                        )?.focus();
                    }
                }}
                onCloseAutoFocus={(event) => {
                    event.preventDefault();

                    if (fromKeyboard) {
                        buttonRef.current?.focus();
                    }
                }}
                onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') {
                        window.clearTimeout(timer.current);
                    }
                }}
                onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') {
                        after(HOVER_CLOSE_DELAY, closePicker);
                    }
                }}
            >
                <ReactionPicker
                    pickerRef={pickerRef}
                    mine={mine}
                    onChoose={choose}
                />
            </PopoverContent>
        </Popover>
    );
}

/** The three reactions in a row; the arrow keys move between them. */
function ReactionPicker({
    pickerRef,
    mine,
    onChoose,
}: {
    pickerRef: RefObject<HTMLDivElement | null>;
    mine: PostReactionType | null;
    onChoose: (type: PostReactionType) => void;
}) {
    function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
        const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];

        if (step === undefined) {
            return;
        }

        const buttons = [...event.currentTarget.querySelectorAll('button')];
        const index = buttons.findIndex(
            (button) => button === document.activeElement,
        );
        event.preventDefault();
        buttons[(index + step + buttons.length) % buttons.length]?.focus();
    }

    return (
        <div
            ref={pickerRef}
            role="toolbar"
            aria-label="Reactions"
            onKeyDown={moveFocus}
            className="flex items-center"
        >
            {POST_REACTIONS.map((reaction, index) => (
                <button
                    key={reaction.value}
                    type="button"
                    aria-pressed={mine === reaction.value}
                    onClick={() => onChoose(reaction.value)}
                    className="group/reaction relative grid size-11 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-muted"
                >
                    <span
                        aria-hidden
                        className={cn(
                            'block text-[1.75rem] leading-none transition-transform duration-150 ease-out group-hover/reaction:-translate-y-1.5 group-hover/reaction:scale-125 group-focus-visible/reaction:-translate-y-1.5 group-focus-visible/reaction:scale-125 motion-safe:animate-in motion-safe:animation-duration-200 motion-safe:fade-in-0 motion-safe:fill-mode-backwards motion-safe:zoom-in-50 motion-reduce:transition-none',
                            POP_DELAYS[index],
                        )}
                    >
                        {reaction.emoji}
                    </span>
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-primary-foreground opacity-0 transition-opacity duration-150 group-hover/reaction:opacity-100 group-focus-visible/reaction:opacity-100">
                        {reaction.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

/** The reactions in the summary overlap, the most given on top. */
const STACK_ORDER = ['z-3', 'z-2', 'z-1'];

/**
 * The reactions so far: which ones were given, most given first, and how
 * many. Hovering names the latest ten people; selecting lists everyone.
 */
export function ReactionsSummary({
    postId,
    summary,
}: {
    postId: string;
    summary: ReactionSummary;
}) {
    const [open, setOpen] = useState(false);
    const [namesShown, setNamesShown] = useState(false);
    // Closing the list hands focus back to the button; that alone should not
    // pop the names up (on a phone it would stay until the next tap).
    const returningFocus = useRef(false);

    if (summary.total === 0) {
        return null;
    }

    const used = usedReactions(summary);
    const more = summary.total - summary.recent.length;

    function openList() {
        setNamesShown(false);
        setOpen(true);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                returningFocus.current = !next;
            }}
        >
            <Tooltip
                open={namesShown}
                onOpenChange={(next) => {
                    if (next && returningFocus.current) {
                        returningFocus.current = false;

                        return;
                    }

                    setNamesShown(next);
                }}
            >
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        <button
                            type="button"
                            onPointerMove={() => {
                                returningFocus.current = false;
                            }}
                            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground tabular-nums transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <span aria-hidden className="flex">
                                {used.map((value, index) => (
                                    <span
                                        key={value}
                                        className={cn(
                                            'relative -ml-1 grid size-5 place-items-center rounded-full bg-card text-[0.8125rem] leading-none ring-2 ring-card first:ml-0',
                                            STACK_ORDER[index],
                                        )}
                                    >
                                        {reactionOption(value).emoji}
                                    </span>
                                ))}
                            </span>
                            <span aria-hidden>{summary.total}</span>
                            <span className="sr-only">
                                {reactionsLabel(summary)}. See who reacted.
                            </span>
                        </button>
                    </DialogTrigger>
                </TooltipTrigger>
                {/* Only the mouse gets here (the button itself opens the
                    list), so a click on the names opens it too. */}
                <TooltipContent
                    side="top"
                    align="end"
                    onClick={openList}
                    className="max-w-60 cursor-pointer"
                >
                    <ul className="space-y-0.5">
                        {summary.recent.map((person) => (
                            <li key={person.id} className="truncate">
                                <span aria-hidden>
                                    {reactionOption(person.type).emoji}
                                </span>{' '}
                                {person.name}
                            </li>
                        ))}
                    </ul>
                    {more > 0 && (
                        <p className="mt-1 font-medium underline underline-offset-2">
                            See {more} more
                        </p>
                    )}
                </TooltipContent>
            </Tooltip>
            <ReactionsDialog postId={postId} summary={summary} />
        </Dialog>
    );
}

type ReactionFilter = PostReactionType | 'all';

const tabClass = underlineTabs.tab;

/** Everyone who reacted, with a tab for each reaction given. */
function ReactionsDialog({
    postId,
    summary,
}: {
    postId: string;
    summary: ReactionSummary;
}) {
    const used = usedReactions(summary);
    const filters: ReactionFilter[] = ['all', ...used];

    return (
        <DialogContent
            data-surface="hei"
            showCloseButton={false}
            className="flex max-h-[min(85dvh,40rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[28rem]"
        >
            <header className="relative flex h-15 shrink-0 items-center justify-center border-b px-14">
                <DialogTitle className="text-base font-medium">
                    Reactions
                </DialogTitle>
                <DialogClose className="absolute right-3 flex size-9 items-center justify-center rounded-full bg-muted outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <X aria-hidden className="size-4" />
                    <span className="sr-only">Close</span>
                </DialogClose>
            </header>
            <DialogDescription className="sr-only">
                Everyone who reacted to this post, newest first.
            </DialogDescription>

            <Tabs defaultValue="all" className="min-h-0 flex-1 gap-0">
                <TabsList
                    aria-label="Show reactions"
                    className={cn(underlineTabs.list, 'px-2')}
                >
                    <TabsTrigger value="all" className={tabClass}>
                        All
                        <span className="tabular-nums">{summary.total}</span>
                    </TabsTrigger>
                    {used.map((value) => {
                        const reaction = reactionOption(value);

                        return (
                            <TabsTrigger
                                key={value}
                                value={value}
                                aria-label={`${reaction.label}, ${summary.counts[value]}`}
                                className={tabClass}
                            >
                                <span aria-hidden className="text-base">
                                    {reaction.emoji}
                                </span>
                                <span aria-hidden className="tabular-nums">
                                    {summary.counts[value]}
                                </span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
                {filters.map((filter) => (
                    <TabsContent
                        key={filter}
                        value={filter}
                        className="min-h-0 overflow-y-auto"
                    >
                        <ReactorList postId={postId} filter={filter} />
                    </TabsContent>
                ))}
            </Tabs>
        </DialogContent>
    );
}

type ReactorPage = { data: Reactor[]; meta: { next_cursor: string | null } };

type LoadedReactors = {
    /** The page these came through: null for the first. */
    cursor: string | null;
    people: Reactor[];
    next: string | null;
};

/** Everyone who chose this reaction (or any), newest first, a page at a time. */
function ReactorList({
    postId,
    filter,
}: {
    postId: string;
    filter: ReactionFilter;
}) {
    // The page wanted: null for the first, then the cursor "Show more" follows.
    const [cursor, setCursor] = useState<string | null>(null);
    const [loaded, setLoaded] = useState<LoadedReactors | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams();

        if (filter !== 'all') {
            params.set('type', filter);
        }

        if (cursor) {
            params.set('cursor', cursor);
        }

        fetch(`/posts/${postId}/reactions?${params}`, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const page = (await response.json()) as ReactorPage;
                setLoaded((current) => ({
                    cursor,
                    people:
                        cursor && current
                            ? [...current.people, ...page.data]
                            : page.data,
                    next: page.meta.next_cursor,
                }));
                setFailed(false);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [postId, filter, cursor, attempt]);

    const people = loaded?.people ?? [];
    const loading = !failed && loaded?.cursor !== cursor;

    function retry() {
        setFailed(false);
        setAttempt((value) => value + 1);
    }

    if (loading && people.length === 0) {
        return (
            <ul aria-hidden className="space-y-1 px-4 py-3 sm:px-5">
                {[0, 1, 2, 3].map((row) => (
                    <li key={row} className="flex items-center gap-3 py-2">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-2/5" />
                            <Skeleton className="h-3 w-3/5" />
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    if (failed && people.length === 0) {
        return <LoadFailed onRetry={retry} />;
    }

    if (people.length === 0) {
        return (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                No reactions yet.
            </p>
        );
    }

    return (
        <div aria-busy={loading}>
            <ul className="py-2">
                {people.map((person) => (
                    <ReactorRow key={person.id} person={person} />
                ))}
            </ul>
            {failed ? (
                <LoadFailed onRetry={retry} />
            ) : (
                loaded?.next && (
                    <div className="px-4 pb-4 sm:px-5">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={() => setCursor(loaded.next)}
                            className="h-10 w-full rounded-[10px]"
                        >
                            {loading && <Spinner />}
                            {loading ? 'Loading…' : 'Show more'}
                        </Button>
                    </div>
                )
            )}
        </div>
    );
}

function ReactorRow({ person }: { person: Reactor }) {
    const reaction = reactionOption(person.type);

    return (
        <li className="flex items-center gap-3 px-4 py-2 sm:px-5">
            <span className="relative shrink-0">
                <PersonAvatar
                    name={person.name}
                    src={person.avatar}
                    className="size-10"
                />
                <span
                    aria-hidden
                    className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-card text-xs leading-none ring-2 ring-card"
                >
                    {reaction.emoji}
                </span>
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                    {person.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                    {person.hei ?? CHED_LABEL}
                </span>
            </span>
            <span className="sr-only">reacted with {reaction.label}</span>
        </li>
    );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
                Could not load who reacted. Check your connection and try again.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Try again
            </Button>
        </div>
    );
}
