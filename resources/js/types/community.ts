export type PersonRef = { id: number; name: string };

/** A post or comment author; deactivated accounts keep their content. */
export type AuthorRef = PersonRef & {
    /** Profile photo URL, or null to show initials. */
    avatar: string | null;
    deactivated: boolean;
};

/** An institution: the official directory name plus a readable display form. */
export type HeiRef = { id: number; name: string; display_name: string };

export type PostImage = { id: number; url: string };

/** A feeling on a post; the list lives in App\Enums\PostFeeling. */
export type PostFeeling = { value: string; label: string; emoji: string };

/** Someone tagged on a post (or offered for tagging): an active account. */
export type TaggedUser = {
    id: number;
    name: string;
    avatar: string | null;
    hei: string | null;
};

/**
 * A comment, or a reply in a comment's thread (one level, like Facebook).
 * Only top-level comments carry `replies`.
 */
export type PostComment = {
    id: number;
    parent_id: number | null;
    body: string;
    created_at: string | null;
    author: AuthorRef;
    /** Whom a reply answers, shown as their name before the text. */
    reply_to: PersonRef | null;
    /** Written by the post's own author. */
    is_post_author: boolean;
    replies: PostComment[];
    can_delete: boolean;
};

/** What a post says and shows; a shared original carries only this. */
export type PostContent = {
    /** A ULID. */
    id: string;
    body: string | null;
    created_at: string | null;
    author: AuthorRef;
    hei: HeiRef | null;
    images: PostImage[];
    feeling: PostFeeling | null;
    tags: TaggedUser[];
};

export type Post = PostContent & {
    edited: boolean;
    /** The original, when this post is a share of it. */
    shared_post: PostContent | null;
    likes_count: number;
    liked: boolean;
    comments_count: number;
    shares_count: number;
    comments: PostComment[];
    /** More comment threads exist than were sent with the post. */
    has_more_comments: boolean;
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
