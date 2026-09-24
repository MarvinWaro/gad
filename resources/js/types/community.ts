export type PersonRef = { id: number; name: string };

/** An institution: the official directory name plus a readable display form. */
export type HeiRef = { id: number; name: string; display_name: string };

export type PostImage = { id: number; url: string };

export type PostComment = {
    id: number;
    body: string;
    created_at: string | null;
    author: PersonRef;
    can_delete: boolean;
};

export type Post = {
    id: number;
    body: string | null;
    created_at: string | null;
    edited: boolean;
    author: PersonRef;
    hei: HeiRef | null;
    images: PostImage[];
    likes_count: number;
    liked: boolean;
    comments_count: number;
    comments: PostComment[];
    can_edit: boolean;
    can_delete: boolean;
};

export type ScrollPage<T> = { data: T[] };

export type EventCategory =
    | 'training'
    | 'campaign'
    | 'deadline'
    | 'meeting'
    | 'other';

/** Event times are Philippine wall-clock strings without an offset. */
export type CalendarEvent = {
    id: number;
    title: string;
    description: string | null;
    location: string | null;
    category: EventCategory;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
};

export type CalendarMonth = {
    month: string;
    today: string;
    events: CalendarEvent[];
};

export type HeiSurvey = {
    id: number;
    code: string;
    law_title: string;
    url: string;
    is_open: boolean;
    responses_from_hei: number;
};

export type HeiSummary = HeiRef & { cluster: string | null };
