import { Head, InfiniteScroll, router, useHttp } from '@inertiajs/react';
import { ArrowUp, CheckCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { selectClass } from '@/components/monitoring/shared';
import {
    NotificationItem,
    NotificationSkeleton,
    NotificationsEmpty,
    requestFailure,
} from '@/components/notifications/notification-item';
import {
    EmptyList,
    Filter,
    FilterBar,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import type { FormSelectOption } from '@/components/ui/form-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { setInbox, useInbox } from '@/hooks/use-inbox';
import { unreadSentence } from '@/lib/notifications';
import { underlineTabs } from '@/lib/underline-tabs';
import { cn } from '@/lib/utils';
import { index, readAll } from '@/routes/notifications';
import type { ScrollPage } from '@/types';
import type {
    AppNotification,
    Inbox,
    NotificationFilters,
} from '@/types/notifications';

/** Closer to the top than this, new notifications load straight in. */
const TOP_ZONE = 200;

/** Change the list in place, as the server now has it. */
function patchList(update: (items: AppNotification[]) => AppNotification[]) {
    router.replaceProp('notifications.data', (items: unknown) =>
        update(items as AppNotification[]),
    );
}

/**
 * Every notification the signed-in person has, newest first, in a centred
 * column: All or Unread, a search, and the type and module filters. Older
 * ones load as the reader scrolls; ones that arrive while the page is open
 * load straight in near the top, or wait behind a button further down.
 */
export default function Notifications({
    notifications,
    filters,
    kinds,
    modules,
}: {
    notifications: ScrollPage<AppNotification>;
    filters: NotificationFilters;
    kinds: FormSelectOption[];
    modules: FormSelectOption[];
}) {
    const inbox = useInbox();
    // Each filter is a full visit, which replaces the list and starts it over.
    const { values, loading, apply, change, search } =
        useRecordFilters<NotificationFilters>(index.url(), filters);
    const tab = values.status === 'unread' ? 'unread' : 'all';
    const narrowed = Boolean(filters.search || filters.kind || filters.module);
    const list = useRef<HTMLUListElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const markAll = useHttp<Record<string, never>, { inbox: Inbox }>({});
    const [seenLatest, setSeenLatest] = useState(inbox.latest_at);
    const [waiting, setWaiting] = useState(false);
    const arrived =
        inbox.latest_at !== null &&
        (seenLatest === null || inbox.latest_at > seenLatest);

    /** Load the newest page again, from the top if asked. */
    const refresh = useCallback((fromTop = false) => {
        if (fromTop) {
            const reduced = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;
            window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        }

        setWaiting(false);
        router.reload({
            only: ['notifications', 'kinds', 'modules'],
            reset: ['notifications'],
        });
    }, []);

    useEffect(() => {
        if (!arrived) {
            return;
        }

        setSeenLatest(inbox.latest_at);

        if (window.scrollY < TOP_ZONE) {
            refresh();
        } else {
            setWaiting(true);
        }
    }, [arrived, inbox.latest_at, refresh]);

    function markAllRead() {
        markAll
            .post(readAll.url(), {
                onSuccess: (result) => {
                    const now = new Date().toISOString();
                    patchList((items) =>
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
        patchList((items) =>
            items.map((item) =>
                item.id === notification.id ? notification : item,
            ),
        );
        setInbox(next);
    }

    function removed(id: string, next: Inbox) {
        const items = notifications.data;
        const at = items.findIndex((item) => item.id === id);
        const neighbour = items[at + 1] ?? items[at - 1];
        patchList((current) => current.filter((item) => item.id !== id));
        setInbox(next);
        // Once the row and its confirmation are gone.
        window.setTimeout(() => {
            const target = neighbour
                ? list.current?.querySelector<HTMLElement>(
                      `[data-notification="${neighbour.id}"] a`,
                  )
                : heading.current;
            target?.focus();
        }, 0);
    }

    return (
        <>
            <Head title="Notifications" />
            <div className="flex flex-1 flex-col p-4 md:p-6">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    <header className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1
                                ref={heading}
                                tabIndex={-1}
                                className="text-2xl font-medium tracking-tight outline-none"
                            >
                                Notifications
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {unreadSentence(inbox.unread)}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={markAllRead}
                            disabled={inbox.unread === 0 || markAll.processing}
                        >
                            <CheckCheck />
                            Mark all as read
                        </Button>
                    </header>

                    {/* Takes no space: the button floats under the top bar. */}
                    {waiting && (
                        <div className="sticky top-[calc(var(--app-header,0px)+0.75rem)] z-20 -my-3 flex h-0 items-start justify-center">
                            <Button
                                type="button"
                                onClick={() => refresh(true)}
                                className="h-9 rounded-lg px-4 shadow-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2"
                            >
                                <ArrowUp aria-hidden />
                                New notifications
                            </Button>
                        </div>
                    )}
                    <p role="status" className="sr-only">
                        {waiting
                            ? 'New notifications arrived. Use the button at the top of the list to see them.'
                            : ''}
                    </p>

                    <Tabs
                        value={tab}
                        onValueChange={(next) =>
                            change({
                                ...values,
                                status: next === 'unread' ? 'unread' : '',
                            })
                        }
                        className="gap-4"
                    >
                        <TabsList
                            aria-label="Show notifications"
                            className={underlineTabs.list}
                        >
                            <TabsTrigger
                                value="all"
                                className={underlineTabs.tab}
                            >
                                All
                            </TabsTrigger>
                            <TabsTrigger
                                value="unread"
                                className={underlineTabs.tab}
                            >
                                Unread
                                {inbox.unread > 0 && (
                                    <span className="rounded-full bg-brand px-1.5 py-0.5 text-xs leading-none font-medium text-brand-foreground tabular-nums">
                                        {inbox.unread > 99
                                            ? '99+'
                                            : inbox.unread}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={tab}>
                            <div className="@container overflow-hidden rounded-xl border bg-card">
                                {/* Nothing to filter until something arrives. */}
                                {kinds.length > 0 && (
                                    <FilterBar
                                        label="Filter notifications"
                                        filters={2}
                                        className="@2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] @2xl:[&>form]:col-span-1"
                                    >
                                        <SearchFilter
                                            value={values.search}
                                            placeholder="Name or record"
                                            onSearch={search}
                                            onSubmit={() => apply(values)}
                                        />
                                        <Filter label="Type" id="kind">
                                            <FormSelect
                                                id="kind"
                                                className={selectClass}
                                                value={values.kind}
                                                onChange={(kind) =>
                                                    change({ ...values, kind })
                                                }
                                                placeholder="All types"
                                                allowEmpty
                                                options={kinds}
                                            />
                                        </Filter>
                                        <Filter label="Module" id="module">
                                            <FormSelect
                                                id="module"
                                                className={selectClass}
                                                value={values.module}
                                                onChange={(module) =>
                                                    change({
                                                        ...values,
                                                        module,
                                                    })
                                                }
                                                placeholder="All modules"
                                                allowEmpty
                                                options={modules}
                                            />
                                        </Filter>
                                    </FilterBar>
                                )}

                                <div
                                    aria-busy={loading}
                                    className={cn(
                                        'transition-opacity',
                                        loading && 'opacity-60',
                                    )}
                                >
                                    {notifications.data.length === 0 ? (
                                        <EmptyState
                                            narrowed={narrowed}
                                            unreadOnly={tab === 'unread'}
                                            onClear={() =>
                                                change({
                                                    ...values,
                                                    search: '',
                                                    kind: '',
                                                    module: '',
                                                })
                                            }
                                        />
                                    ) : (
                                        <InfiniteScroll
                                            data="notifications"
                                            preserveUrl
                                            buffer={600}
                                            itemsElement={list}
                                            next={({ loading, hasMore }) =>
                                                loading ? (
                                                    <NotificationSkeleton />
                                                ) : (
                                                    !hasMore && (
                                                        <p className="border-t py-5 text-center text-sm text-muted-foreground">
                                                            No older
                                                            notifications
                                                        </p>
                                                    )
                                                )
                                            }
                                        >
                                            <ul
                                                ref={list}
                                                aria-label="Notifications, newest first"
                                                className="divide-y"
                                            >
                                                {notifications.data.map(
                                                    (notification) => (
                                                        <NotificationItem
                                                            key={
                                                                notification.id
                                                            }
                                                            notification={
                                                                notification
                                                            }
                                                            onUpdated={updated}
                                                            onRemoved={removed}
                                                        />
                                                    ),
                                                )}
                                            </ul>
                                        </InfiniteScroll>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

/** None at all, none unread, or none that match the filters. */
function EmptyState({
    narrowed,
    unreadOnly,
    onClear,
}: {
    narrowed: boolean;
    unreadOnly: boolean;
    onClear: () => void;
}) {
    if (narrowed) {
        return (
            <EmptyList
                filtered
                title="No notifications match"
                text="Try other words, or clear the filters."
                onClear={onClear}
            />
        );
    }

    return unreadOnly ? (
        <NotificationsEmpty
            title="No unread notifications"
            text="Everything here has been read."
        />
    ) : (
        <NotificationsEmpty
            title="No notifications yet"
            text="Comments on your posts, reviews of your reports and approvals will show here."
        />
    );
}

Notifications.layout = {
    breadcrumbs: [{ title: 'Notifications', href: index.url() }],
};
