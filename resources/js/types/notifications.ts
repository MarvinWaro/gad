import type { ActivityTone } from '@/types/activity';
import type { PostReactionType } from '@/types/community';

/** How many notifications are unread, and when the newest arrived. */
export type Inbox = { unread: number; latest_at: string | null };

/** One notification, as `NotificationResource` sends it. */
export type AppNotification = {
    id: string;
    kind: { code: string; label: string; tone: ActivityTone };
    module: { code: string; label: string };
    /** Null when no one acted (survey answers) or the system did (an earned badge). */
    actor: { id: number | null; name: string; avatar: string | null } | null;
    /** What it says after the actor's name; `subject` is set in bold. */
    sentence: { before: string; subject: string | null; after: string };
    /** The reviewer's comment on a report. */
    quote: string | null;
    reaction: PostReactionType | null;
    /** How many it stands for, for notices that group. */
    count: number;
    /** Where it leads, while the record exists and the reader may open it. */
    url: string | null;
    read_at: string | null;
    notified_at: string;
};

/** A page of the bell's panel, from `GET /notifications/recent`. */
export type NotificationPage = {
    data: AppNotification[];
    meta: { next_cursor: string | null };
    inbox: Inbox;
};

export type NotificationFilters = {
    status: string;
    search: string;
    kind: string;
    module: string;
};
