import { Link, useHttp } from '@inertiajs/react';
import { Bell, CheckCheck, RotateCw } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
    NotificationItem,
    NotificationSkeleton,
    NotificationsEmpty,
    requestFailure,
} from '@/components/notifications/notification-item';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    getJson,
    setInbox,
    useInbox,
    useInboxPolling,
} from '@/hooks/use-inbox';
import { badgeLabel, bellLabel, unreadSentence } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { index, readAll, recent } from '@/routes/notifications';
import type {
    AppNotification,
    Inbox,
    NotificationPage,
} from '@/types/notifications';

/** Newer ones first, without repeats: a notice that counted up moves up. */
function merge(newer: AppNotification[], older: AppNotification[]) {
    const ids = new Set(newer.map((notification) => notification.id));

    return [
        ...newer,
        ...older.filter((notification) => !ids.has(notification.id)),
    ];
}

/** Move focus once the removed row and its closing popover are gone. */
function focusSoon(target: () => HTMLElement | null | undefined) {
    window.setTimeout(() => target()?.focus(), 0);
}

/**
 * The newest notifications for the panel: loaded afresh each time it opens,
 * joined by anything that arrives while it is open, and five more each time
 * the reader reaches the end.
 */
function useNotificationPanel(open: boolean, latestAt: string | null) {
    const [items, setItems] = useState<AppNotification[]>([]);
    const [next, setNext] = useState<string | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [moreFailed, setMoreFailed] = useState(false);
    // The newest arrival the open panel shows; undefined while closed.
    const shownLatest = useRef<string | null | undefined>(undefined);
    const scroller = useRef<HTMLDivElement>(null);
    const sentinel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            shownLatest.current = undefined;

            return;
        }

        if (
            shownLatest.current !== undefined &&
            shownLatest.current === latestAt
        ) {
            return;
        }

        const merging = shownLatest.current !== undefined;
        const controller = new AbortController();

        getJson<NotificationPage>(recent.url(), controller.signal)
            .then((page) => {
                if (!page) {
                    setFailed(true);

                    return;
                }

                shownLatest.current = page.inbox.latest_at;
                setItems((current) =>
                    merging ? merge(page.data, current) : page.data,
                );

                if (!merging) {
                    setNext(page.meta.next_cursor);
                    setMoreFailed(false);
                }

                setLoaded(true);
                setFailed(false);
                setInbox(page.inbox);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [open, latestAt, attempt]);

    useEffect(() => {
        const root = scroller.current;
        const target = sentinel.current;

        if (
            !open ||
            !loaded ||
            !next ||
            loadingMore ||
            moreFailed ||
            !root ||
            !target
        ) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) {
                    return;
                }

                observer.disconnect();
                setLoadingMore(true);
                getJson<NotificationPage>(
                    recent.url({ query: { cursor: next } }),
                )
                    .then((page) => {
                        if (!page) {
                            setMoreFailed(true);

                            return;
                        }

                        setItems((current) => merge(current, page.data));
                        setNext(page.meta.next_cursor);
                    })
                    .catch(() => setMoreFailed(true))
                    .finally(() => setLoadingMore(false));
            },
            { root },
        );
        observer.observe(target);

        return () => observer.disconnect();
    }, [open, loaded, next, loadingMore, moreFailed]);

    return {
        items,
        setItems,
        next,
        loaded,
        failed,
        loadingMore,
        moreFailed,
        scroller,
        sentinel,
        retry: () => {
            setFailed(false);
            setAttempt((value) => value + 1);
        },
        retryMore: () => setMoreFailed(false),
    };
}

/**
 * The header's bell. A red count shows while anything is unread; it opens a
 * panel of the newest notifications that loads more as it scrolls, with
 * "Mark all as read" and a way to the full Notifications page. The count is
 * checked every 30 seconds, and opening the bell checks at once.
 */
export function NotificationBell({ className }: { className?: string }) {
    useInboxPolling();
    const inbox = useInbox();
    const [open, setOpen] = useState(false);
    const titleId = useId();
    const heading = useRef<HTMLHeadingElement>(null);
    const panel = useNotificationPanel(open, inbox.latest_at);
    const markAll = useHttp<Record<string, never>, { inbox: Inbox }>({});
    // Announce new arrivals to screen readers, not reads or removals.
    const [announcement, setAnnouncement] = useState('');
    const [lastUnread, setLastUnread] = useState(inbox.unread);

    if (inbox.unread !== lastUnread) {
        setLastUnread(inbox.unread);
        setAnnouncement(
            inbox.unread > lastUnread ? unreadSentence(inbox.unread) : '',
        );
    }

    function markAllRead() {
        markAll
            .post(readAll.url(), {
                onSuccess: (result) => {
                    const now = new Date().toISOString();
                    panel.setItems((items) =>
                        items.map((item) =>
                            item.read_at ? item : { ...item, read_at: now },
                        ),
                    );
                    setInbox(result.inbox);
                },
                ...requestFailure,
            })
            .catch(() => undefined);
    }

    function updated(notification: AppNotification, next: Inbox) {
        panel.setItems((items) =>
            items.map((item) =>
                item.id === notification.id ? notification : item,
            ),
        );
        setInbox(next);
    }

    function removed(id: string, next: Inbox) {
        const at = panel.items.findIndex((item) => item.id === id);
        const neighbour = panel.items[at + 1] ?? panel.items[at - 1];
        panel.setItems((items) => items.filter((item) => item.id !== id));
        setInbox(next);
        focusSoon(() =>
            neighbour
                ? panel.scroller.current?.querySelector<HTMLElement>(
                      `[data-notification="${neighbour.id}"] a`,
                  )
                : heading.current,
        );
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={bellLabel(inbox.unread)}
                                className={cn('relative', className)}
                            >
                                <Bell className="size-4" />
                                {inbox.unread > 0 && (
                                    <span
                                        aria-hidden
                                        data-test="notification-badge"
                                        className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-alert-badge px-1 text-xs leading-none font-semibold text-alert-badge-foreground tabular-nums ring-2 ring-background motion-safe:animate-in motion-safe:zoom-in-50"
                                    >
                                        {badgeLabel(inbox.unread)}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Notifications</TooltipContent>
                </Tooltip>
                <PopoverContent
                    align="end"
                    sideOffset={8}
                    collisionPadding={8}
                    aria-labelledby={titleId}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        heading.current?.focus();
                    }}
                    className="flex w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl p-0"
                >
                    <div className="flex min-h-14 items-center justify-between gap-2 border-b py-2 pr-2 pl-4">
                        <h2
                            ref={heading}
                            id={titleId}
                            tabIndex={-1}
                            className="text-base font-medium outline-none"
                        >
                            Notifications
                        </h2>
                        {inbox.unread > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={markAllRead}
                                disabled={markAll.processing}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <CheckCheck />
                                Mark all as read
                            </Button>
                        )}
                    </div>

                    <div
                        ref={panel.scroller}
                        aria-busy={!panel.loaded || panel.loadingMore}
                        className="max-h-[min(26rem,calc(100dvh-11rem))] overflow-y-auto overscroll-contain"
                    >
                        <PanelBody
                            panel={panel}
                            onOpen={() => setOpen(false)}
                            onUpdated={updated}
                            onRemoved={removed}
                        />
                    </div>

                    <div className="border-t p-1.5">
                        <Button asChild variant="ghost" className="w-full">
                            <Link href={index()} onClick={() => setOpen(false)}>
                                View all notifications
                            </Link>
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            <p role="status" className="sr-only">
                {announcement}
            </p>
        </>
    );
}

function PanelBody({
    panel,
    onOpen,
    onUpdated,
    onRemoved,
}: {
    panel: ReturnType<typeof useNotificationPanel>;
    onOpen: () => void;
    onUpdated: (notification: AppNotification, inbox: Inbox) => void;
    onRemoved: (id: string, inbox: Inbox) => void;
}) {
    if (!panel.loaded && panel.failed) {
        return (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                    Notifications could not be loaded.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={panel.retry}
                >
                    <RotateCw />
                    Try again
                </Button>
            </div>
        );
    }

    if (!panel.loaded) {
        return (
            <>
                <p role="status" className="sr-only">
                    Loading notifications
                </p>
                <NotificationSkeleton compact />
                <NotificationSkeleton compact />
                <NotificationSkeleton compact />
            </>
        );
    }

    if (panel.items.length === 0) {
        return (
            <NotificationsEmpty
                title="No notifications yet"
                text="Comments on your posts, reviews of your reports and approvals will show here."
            />
        );
    }

    return (
        <>
            <ul aria-label="Notifications, newest first" className="divide-y">
                {panel.items.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        compact
                        onOpen={onOpen}
                        onUpdated={onUpdated}
                        onRemoved={onRemoved}
                    />
                ))}
            </ul>
            {panel.loadingMore && <NotificationSkeleton compact />}
            {panel.next &&
                (panel.moreFailed ? (
                    <div className="flex justify-center p-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={panel.retryMore}
                        >
                            <RotateCw />
                            Load more
                        </Button>
                    </div>
                ) : (
                    <div ref={panel.sentinel} aria-hidden className="h-px" />
                ))}
        </>
    );
}
