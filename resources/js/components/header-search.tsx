import { Search } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useId, useState } from 'react';
import { IconAction } from '@/components/icon-action';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const label = 'Search PHLGADIS';

/** Nothing is searched yet, so the form never sends. */
function stay(event: FormEvent) {
    event.preventDefault();
}

/** What the search says until it can find people and institutions. */
function ComingSoon({ id, className }: { id: string; className?: string }) {
    return (
        <p id={id} className={cn('text-sm', className)}>
            <span className="font-medium">Search is coming soon.</span>{' '}
            <span className="text-muted-foreground">
                You&rsquo;ll be able to find people and institutions here.
            </span>
        </p>
    );
}

function SearchInput({
    describedBy,
    autoFocus = false,
    className,
    ...events
}: {
    describedBy: string;
    autoFocus?: boolean;
    className?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
    return (
        <div className={cn('relative', className)}>
            <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
                type="search"
                aria-label={label}
                aria-describedby={describedBy}
                placeholder={label}
                autoComplete="off"
                autoFocus={autoFocus}
                className="h-10 w-full rounded-[10px] bg-muted pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:text-sm"
                {...events}
            />
        </div>
    );
}

/**
 * The header's search, as on Facebook: a field beside the icon from 768px,
 * an icon that opens it on phones. It finds nothing yet; while it has focus
 * it says so, rather than leaving a box that silently does nothing.
 */
export function HeaderSearch() {
    return (
        <>
            <InlineSearch />
            <CompactSearch />
        </>
    );
}

function InlineSearch() {
    const noteId = useId();
    const [open, setOpen] = useState(false);

    return (
        <form
            role="search"
            onSubmit={stay}
            className="relative hidden md:block"
        >
            <SearchInput
                describedBy={noteId}
                className="w-56 xl:w-64"
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') setOpen(false);
                }}
            />
            {/* Read with the field even while closed, so screen readers
                hear it on focus. */}
            <div
                hidden={!open}
                className="absolute top-full left-0 z-40 mt-2 w-72 rounded-lg border bg-popover p-3 text-popover-foreground shadow-md"
            >
                <ComingSoon id={noteId} />
            </div>
        </form>
    );
}

function CompactSearch() {
    const noteId = useId();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <IconAction
                    label={label}
                    side="bottom"
                    className="size-10 text-muted-foreground hover:text-foreground md:hidden"
                >
                    <Search className="size-5" />
                </IconAction>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[calc(100vw-2rem)] max-w-sm space-y-3 p-3"
            >
                <form role="search" onSubmit={stay}>
                    <SearchInput describedBy={noteId} autoFocus />
                </form>
                <ComingSoon id={noteId} />
            </PopoverContent>
        </Popover>
    );
}
