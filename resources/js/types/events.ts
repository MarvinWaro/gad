import type { PaginationMeta } from '@/components/pagination';
import type { CalendarEvent, EventCategory, EventStatus } from '@/types';
import type { DirectoryOption } from '@/types/monitoring';

/** `GadEventResource`: an event as its page shows it. */
export type EventDetail = CalendarEvent & {
    /** Null: for every region. */
    region: DirectoryOption | null;
    /** Where it stands, when the page was sent. */
    status: EventStatus;
    ended: boolean;
    /** Whether people may join or leave it now. */
    registration_open: boolean;
    joined_count?: number;
};

/** `EventRegistrationResource`: someone who joined an event. */
export type EventRegistration = {
    id: string;
    joined_at: string;
    person: {
        name: string | null;
        avatar: string | null;
        affiliation: string | null;
        /** An HEI's region; staff are placed by their office. */
        region: string | null;
    };
    /** Put on the list by staff, such as an invitee or a walk-in. */
    added: boolean;
    days_attended?: number;
    /** The days they came, Y-m-d, on the staff list. */
    days?: string[];
};

export type EventRegistrationPage = {
    data: EventRegistration[];
    meta: PaginationMeta;
};

/** `EventGuestResource`: a guest without an account at an event. */
export type EventGuest = {
    id: string;
    name: string;
    organization: string;
    position: string | null;
    sex: 'male' | 'female' | null;
    /** The days they came, Y-m-d. */
    days: string[];
    /** The event certificates (their ids) given to them. */
    certificates: string[];
};

export type EventGuestPage = { data: EventGuest[]; meta: PaginationMeta };

/** `JoinedEventResource`: an event someone joined, how it went for them. */
export type JoinedEvent = {
    id: string;
    joined_at: string;
    event: CalendarEvent & { region: string | null };
    days_attended: number;
    status: 'upcoming' | 'ongoing' | 'attended' | 'missed' | 'cancelled';
    has_certificate: boolean;
};

export type JoinedEventPage = { data: JoinedEvent[]; meta: PaginationMeta };

/**
 * `PublicEventResource`: an event as the public website shows it, in
 * Philippine wall-clock time. Nothing about who joined.
 */
export type PublicEvent = {
    ulid: string;
    title: string;
    description: string | null;
    location: string | null;
    category: EventCategory;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    /** Its region's name; null: for every region. */
    region: string | null;
    status: EventStatus;
    registration_open: boolean;
    registration_closes_at: string | null;
};

export type PublicEventPage = { data: PublicEvent[]; meta: PaginationMeta };

/** The homepage's events strip, for the region picked or every region. */
export type HomepageEvents = {
    region: number | null;
    regions: DirectoryOption[];
    events: PublicEvent[];
};
