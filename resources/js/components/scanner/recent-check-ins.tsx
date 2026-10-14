import { useHttp } from '@inertiajs/react';
import { History, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import { PersonAvatar } from '@/components/person-avatar';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { getJson } from '@/hooks/use-inbox';
import { useIsMobile } from '@/hooks/use-mobile';
import { localTime } from '@/lib/manila-time';
import { cn } from '@/lib/utils';
import {
    destroy,
    index as checkInsIndex,
} from '@/routes/admin/events/check-ins';
import type { CheckIn, CheckInPage, ScannerEvent } from '@/types/scanner';

/**
 * Who has been checked in to the event today, newest first, at every
 * scanner: a drawer from the side on a computer and from the bottom on a
 * phone. It asks again each time it opens, then a page at a time. A
 * check-in made by mistake is undone here, after asking.
 */
export function RecentCheckIns({
    event,
    count,
    onUndone,
}: {
    event: ScannerEvent | null;
    /** Today's count, as the last check-in left it. */
    count: number;
    /** A check-in was undone: today's new count. */
    onUndone: (checkIn: CheckIn, count: number) => void;
}) {
    const http = useHttp<Record<string, never>, { count: number }>({});
    const [problem, setProblem] = useState<string | null>(null);
    const isMobile = useIsMobile();
    const [items, setItems] = useState<CheckIn[]>([]);
    const [next, setNext] = useState<string | null>(null);
    const [total, setTotal] = useState(count);
    const [state, setState] = useState<'loading' | 'ready' | 'failed'>(
        'loading',
    );

    async function load(cursor: string | null) {
        if (!event) {
            return;
        }

        setState('loading');
        const page = await getJson<CheckInPage>(
            checkInsIndex.url(
                event.id,
                cursor ? { query: { cursor } } : undefined,
            ),
        ).catch(() => null);

        if (!page) {
            setState('failed');

            return;
        }

        setItems((shown) => (cursor ? [...shown, ...page.data] : page.data));
        setNext(page.meta.next_cursor);
        setTotal(page.count);
        setState('ready');
    }

    function openChange(open: boolean) {
        if (open) {
            setItems([]);
            setNext(null);
            setProblem(null);
            void load(null);
        }
    }

    async function undo(checkIn: CheckIn, done: () => void) {
        if (!event) {
            return;
        }

        setProblem(null);
        const result = await http
            .delete(destroy.url([event.id, checkIn.id]), {
                onError: (errors) => {
                    const messages: Partial<Record<string, string>> = errors;
                    setProblem(Object.values(messages)[0] ?? null);
                },
                onHttpException: () =>
                    setProblem('The check-in could not be undone. Try again.'),
                onNetworkError: () =>
                    setProblem(
                        'You appear to be offline. Check the connection, then try again.',
                    ),
            })
            .catch(() => undefined);
        done();

        if (result) {
            setItems((shown) => shown.filter((item) => item.id !== checkIn.id));
            setTotal(result.count);
            onUndone(checkIn, result.count);
        }
    }

    return (
        <Sheet onOpenChange={openChange}>
            <SheetTrigger asChild>
                <Button type="button" variant="outline" disabled={!event}>
                    <History />
                    Recent
                    <span className="rounded-md bg-muted px-1.5 text-xs tabular-nums">
                        {count}
                    </span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side={isMobile ? 'bottom' : 'right'}
                className={cn(
                    'gap-0 p-0',
                    isMobile ? 'max-h-[85svh]' : 'w-full sm:max-w-md',
                )}
            >
                <SheetHeader className="border-b pr-12">
                    <SheetTitle>Checked in today</SheetTitle>
                    <SheetDescription>
                        {event?.title} · {total}{' '}
                        {total === 1 ? 'person' : 'people'}
                    </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto p-2">
                    {problem && (
                        <p
                            role="alert"
                            className="mx-2 mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                        >
                            {problem}
                        </p>
                    )}
                    {items.length > 0 && (
                        <ul aria-label="Checked in today">
                            {items.map((checkIn) => (
                                <li
                                    key={checkIn.id}
                                    className="flex min-h-14 items-center gap-3 rounded-lg px-2 py-2"
                                >
                                    <PersonAvatar
                                        name={checkIn.person.name ?? ''}
                                        src={checkIn.person.avatar}
                                        className="size-9"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {checkIn.person.name}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {checkIn.person.affiliation}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm tabular-nums">
                                            {localTime(checkIn.checked_in_at)}
                                        </p>
                                        {checkIn.method === 'typed' && (
                                            <p className="text-xs text-muted-foreground">
                                                Typed
                                            </p>
                                        )}
                                    </div>
                                    <ConfirmPopover
                                        title={`Undo the check-in of ${checkIn.person.name ?? 'this person'}?`}
                                        description="Their attendance today is taken back. Scan them again if they are here."
                                        confirmLabel="Undo check-in"
                                        onConfirm={(visit) => {
                                            visit.onStart();
                                            void undo(checkIn, visit.onFinish);
                                        }}
                                    >
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-muted-foreground"
                                        >
                                            <Undo2 />
                                            <span className="sr-only">
                                                Undo the check-in of{' '}
                                                {checkIn.person.name}
                                            </span>
                                        </Button>
                                    </ConfirmPopover>
                                </li>
                            ))}
                        </ul>
                    )}
                    {state === 'loading' && items.length === 0 && (
                        <div aria-busy="true" className="space-y-2 p-2">
                            {[0, 1, 2].map((row) => (
                                <div
                                    key={row}
                                    className="flex items-center gap-3"
                                >
                                    <Skeleton className="size-9 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-2/3" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {state === 'ready' && items.length === 0 && (
                        <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                            No one is checked in yet today.
                        </p>
                    )}
                    {state === 'failed' && (
                        <div className="flex flex-col items-center gap-2 px-2 py-6 text-center text-sm text-muted-foreground">
                            <p>Couldn&apos;t load the list.</p>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void load(next)}
                            >
                                Try again
                            </Button>
                        </div>
                    )}
                    {next && state !== 'failed' && (
                        <div className="p-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={state === 'loading'}
                                onClick={() => void load(next)}
                            >
                                {state === 'loading' && <Spinner />}
                                Show more
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
