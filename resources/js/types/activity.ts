import type { PaginationMeta } from '@/components/pagination';

/** How an entry is coloured, by what the action did. */
export type ActivityTone =
    | 'positive'
    | 'info'
    | 'warning'
    | 'danger'
    | 'neutral';

/** One entry, as `ActivityLogResource` sends it. */
export type ActivityEntry = {
    id: string;
    action: { code: string; label: string; tone: ActivityTone };
    module: { code: string; label: string };
    /** The sentence around the subject's name, which is set in bold. */
    sentence: { before: string; subject: string | null; after: string };
    /** `id` is null for a failed login or the system. */
    actor: { id: number | null; name: string; avatar: string | null };
    /** `url` while the record still exists. */
    subject: { type: string | null; id: string | null; url: string | null };
    place: {
        region: string | null;
        hei: string | null;
    };
    changes: { field: string; before: string | null; after: string | null }[];
    details: { label: string; value: string | null }[];
    device: string | null;
    ip_address: string | null;
    created_at: string;
};

export type ActivityPage = { data: ActivityEntry[]; meta: PaginationMeta };

export type ActivityFilters = {
    search: string;
    module: string;
    action: string;
    user: string;
    from: string;
    to: string;
    region: string;
    hei: string;
};
