import { Link, useHttp } from '@inertiajs/react';
import {
    Award,
    BadgeCheck,
    Bell,
    CalendarPlus,
    Check,
    ClipboardCheck,
    ClipboardList,
    FileUp,
    Forward,
    MailOpen,
    MessageCircle,
    MessageSquareText,
    MoreHorizontal,
    Reply,
    Tag,
    Trash2,
    Undo2,
    UserCheck,
    UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
import { PersonAvatar } from '@/components/person-avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { localDateTime } from '@/lib/manila-time';
import { reactionOption } from '@/lib/post-reactions';
import { formatRelative } from '@/lib/relative-time';
import { toast } from '@/lib/toast';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { destroy, open, update } from '@/routes/notifications';
import type { AppNotification, Inbox } from '@/types/notifications';

/** Each kind's mark, beside the person who acted. */
const kindIcons: Record<string, LucideIcon> = {
    post_commented: MessageCircle,
    comment_replied: Reply,
    post_shared: Forward,
    post_tagged: Tag,
    post_removed: Trash2,
    comment_removed: Trash2,
    report_submitted: FileUp,
    report_reviewed: BadgeCheck,
    report_returned: Undo2,
    gad_survey_submitted: ClipboardCheck,
    account_pending: UserPlus,
    account_approved: UserCheck,
    event_created: CalendarPlus,
    survey_responses: ClipboardList,
    site_feedback: MessageSquareText,
    badge_awarded: Award,
    badge_earned: Award,
    user_followed: UserPlus,
};

export type NotificationChanges = {
    /** It was marked read or unread. */
    onUpdated: (notification: AppNotification, inbox: Inbox) => void;
    /** It was deleted. */
    onRemoved: (id: string, inbox: Inbox) => void;
};

type UpdateResult = { notification: AppNotification; inbox: Inbox };

/** What a notification request says when it does not go through. */
export const requestFailure = {
    onHttpException: () => {
        toast.error('That did not go through. Try again.');
    },
    onNetworkError: () => {
        toast.error('You appear to be offline.');
    },
};

/**
 * One notification, in the bell's panel (`compact`) or on the Notifications
 * page. The whole row opens it, which also marks it read. The ⋯ menu marks
 * it read or unread, or deletes it after asking.
 */
export function NotificationItem({
    notification,
    compact = false,
    onOpen,
    onUpdated,
    onRemoved,
}: NotificationChanges & {
    notification: AppNotification;
    compact?: boolean;
    /** Called as it opens, such as to close the panel. */
    onOpen?: () => void;
}) {
    const unread = notification.read_at === null;
    const { actor, sentence } = notification;
    const [confirmDelete, setConfirmDelete] = useState(false);
    // Set when "Delete notification" is picked. The confirmation opens once
    // the menu has closed, so the closing menu cannot pull focus from it.
    const deleteChosen = useRef(false);
    const request = useHttp<{ read: boolean }, UpdateResult>({ read: true });
    const removal = useHttp<Record<string, never>, { inbox: Inbox }>({});

    function setRead(read: boolean) {
        request.transform(() => ({ read }));
        request
            .patch(update.url(notification.id), {
                onSuccess: (result) =>
                    onUpdated(result.notification, result.inbox),
                ...requestFailure,
            })
            // Failures are told above.
            .catch(() => undefined);
    }

    function remove(visit: ConfirmVisit) {
        visit.onStart();
        removal
            .delete(destroy.url(notification.id), {
                onSuccess: (result) => {
                    toast.deleted('Notification deleted.');
                    onRemoved(notification.id, result.inbox);
                },
                ...requestFailure,
            })
            .catch(() => undefined)
            .finally(visit.onFinish);
    }

    return (
        <li
            data-notification={notification.id}
            className={cn(
                'group/notice relative flex items-start gap-3 transition-colors',
                compact ? 'py-3 pr-2 pl-4' : 'py-4 pr-3 pl-4 sm:pl-5',
                unread
                    ? 'bg-brand-soft/60 hover:bg-brand-soft'
                    : 'hover:bg-muted',
            )}
        >
            <NotificationMark
                notification={notification}
                className={compact ? 'size-10' : 'size-11'}
            />
            {/* Stretched over the row, so all of it opens the notification. */}
            <Link
                href={open(notification.id)}
                onClick={onOpen}
                className="min-w-0 flex-1 outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
            >
                <p
                    className={cn(
                        'text-sm leading-snug text-pretty break-words',
                        compact && 'line-clamp-3',
                    )}
                >
                    {unread && <span className="sr-only">Unread: </span>}
                    {actor && (
                        <>
                            <span className="font-medium">
                                {actor.name}
                            </span>{' '}
                        </>
                    )}
                    {sentence.before}
                    {sentence.subject && (
                        <>
                            {' '}
                            <span className="font-medium">
                                {sentence.subject}
                            </span>
                        </>
                    )}
                    {sentence.after && ` ${sentence.after}`}
                </p>
                {notification.quote && (
                    <p className="mt-1 line-clamp-2 text-[0.8125rem] text-muted-foreground">
                        “{notification.quote}”
                    </p>
                )}
                <p className="mt-1 text-xs">
                    <time
                        dateTime={notification.notified_at}
                        title={localDateTime(notification.notified_at)}
                        className={
                            unread
                                ? 'font-medium text-brand'
                                : 'text-muted-foreground'
                        }
                    >
                        {formatRelative(notification.notified_at)}
                    </time>
                    {!compact && (
                        <span className="text-muted-foreground">
                            {' '}
                            · {notification.module.label}
                        </span>
                    )}
                </p>
            </Link>

            {/* Above the stretched link; clicks between the controls still
                reach it. */}
            <div className="pointer-events-none relative z-10 flex shrink-0 items-center gap-0.5 self-center">
                <DropdownMenu modal={false}>
                    {/* "Delete notification" opens this, pointing at ⋯. */}
                    <ConfirmPopover
                        title="Delete this notification?"
                        description="It is removed from your list. What it points to stays as it is."
                        confirmLabel="Delete"
                        open={confirmDelete}
                        onOpenChange={setConfirmDelete}
                        anchorOnly
                        onConfirm={remove}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Notification options"
                                className={cn(
                                    'pointer-events-auto size-9 rounded-full text-muted-foreground opacity-0 transition-opacity group-focus-within/notice:opacity-100 group-hover/notice:opacity-100 hover:bg-background focus-visible:opacity-100 data-[state=open]:opacity-100 pointer-coarse:opacity-100',
                                    confirmDelete && 'opacity-100',
                                )}
                            >
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                    </ConfirmPopover>
                    <DropdownMenuContent
                        align="end"
                        className="w-52"
                        onCloseAutoFocus={(event) => {
                            if (deleteChosen.current) {
                                event.preventDefault();
                                deleteChosen.current = false;
                                setConfirmDelete(true);
                            }
                        }}
                    >
                        <DropdownMenuItem onSelect={() => setRead(unread)}>
                            {unread ? <Check /> : <MailOpen />}
                            {unread ? 'Mark as read' : 'Mark as unread'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => {
                                deleteChosen.current = true;
                            }}
                            className="text-destructive focus:text-destructive [&_svg]:!text-destructive"
                        >
                            <Trash2 />
                            Delete notification
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <span
                    aria-hidden
                    className={cn(
                        'size-2.5 rounded-full',
                        unread ? 'bg-brand' : 'bg-transparent',
                    )}
                />
            </div>
        </li>
    );
}

/**
 * The person who acted, with a small mark for the kind or the reaction they
 * gave. A notice no one's action explains, such as survey answers, shows
 * the kind's mark alone.
 */
function NotificationMark({
    notification,
    className,
}: {
    notification: AppNotification;
    className: string;
}) {
    const Icon = kindIcons[notification.kind.code] ?? Bell;

    if (!notification.actor) {
        return (
            <span
                aria-hidden
                className={cn(
                    'flex shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground',
                    className,
                )}
            >
                <Icon className="size-5" />
            </span>
        );
    }

    return (
        <span aria-hidden className="relative shrink-0">
            <PersonAvatar
                name={notification.actor.name}
                src={notification.actor.avatar}
                className={className}
            />
            {notification.reaction ? (
                <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-card text-xs leading-none ring-2 ring-card">
                    {reactionOption(notification.reaction).emoji}
                </span>
            ) : (
                <span
                    className={cn(
                        'absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full ring-2 ring-card',
                        tones[notification.kind.tone].solid,
                    )}
                >
                    <Icon className="size-3" />
                </span>
            )}
        </span>
    );
}

/** A notification's outline while it loads. */
export function NotificationSkeleton({ compact = false }) {
    return (
        <div
            aria-hidden
            className={cn(
                'flex gap-3',
                compact ? 'px-4 py-3' : 'px-4 py-4 sm:px-5',
            )}
        >
            <Skeleton
                className={cn(
                    'shrink-0 rounded-full',
                    compact ? 'size-10' : 'size-11',
                )}
            />
            <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
    );
}

/** Nothing to show: none yet, or none unread. */
export function NotificationsEmpty({
    title,
    text,
}: {
    title: string;
    text: string;
}) {
    return (
        <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Bell aria-hidden className="size-5 text-muted-foreground" />
            </span>
            <p className="mt-4 font-medium">{title}</p>
            <p className="mt-1 max-w-xs text-sm text-pretty text-muted-foreground">
                {text}
            </p>
        </div>
    );
}
