import { router } from '@inertiajs/react';
import {
    NotificationMark,
    NotificationSentence,
} from '@/components/notifications/notification-item';
import { Button } from '@/components/ui/button';
import { localDateTime } from '@/lib/manila-time';
import { toast } from '@/lib/toast';
import { open } from '@/routes/notifications';
import type { AppNotification } from '@/types/notifications';

/** Long enough to read a notification, as Facebook keeps its own up. */
export const ARRIVAL_MS = 8_000;

/**
 * A notification that just arrived, as a toast: who acted, outlined in the
 * notification's colour, what it says, and Open beside when it came.
 */
function ArrivalToast({
    id,
    notification,
}: {
    id: string | number;
    notification: AppNotification;
}) {
    return (
        <div className="flex w-[356px] max-w-[calc(100vw-2rem)] gap-3 rounded-[10px] border bg-popover p-4 text-popover-foreground shadow-lg">
            <NotificationMark
                notification={notification}
                className="size-10"
                ringed
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-pretty break-words">
                    <NotificationSentence notification={notification} />
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                        {notification.module.label}
                        <time
                            dateTime={notification.notified_at}
                            className="block tabular-nums"
                        >
                            {localDateTime(notification.notified_at)}
                        </time>
                    </p>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                            toast.dismiss(id);
                            router.visit(open.url(notification.id));
                        }}
                    >
                        Open
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * Shows a new notification as a toast. Its id is the notification's, so
 * a notice that counts up replaces its own toast.
 */
export function toastArrival(notification: AppNotification): void {
    toast.custom((id) => <ArrivalToast id={id} notification={notification} />, {
        id: notification.id,
        duration: ARRIVAL_MS,
    });
}
