import type { CalendarEvent } from '@/types/community';

/** One of today's events in the scanner's list (`EventScannerController`). */
export type ScannerEvent = CalendarEvent & {
    /** Its region's name; null when it is for every region. */
    region: string | null;
};

/** How the code reached the scanner (`GadEventCheckIn::METHODS`). */
export type CheckInMethod = 'scan' | 'typed';

/** `GadEventCheckInResource`: someone checked in to an event today. */
export type CheckIn = {
    id: string;
    /** ISO 8601, in UTC. */
    checked_in_at: string;
    method: CheckInMethod;
    person: {
        name: string | null;
        avatar: string | null;
        /** Their institution, or their CHED office. */
        affiliation: string | null;
        /** An HEI's region; null for staff, whose affiliation names it. */
        region: string | null;
        /** Role names, such as "HEI Focal". */
        roles: string[];
    };
    /** The staff member who checked them in. */
    checked_in_by: string | null;
};

/** What checking someone in answers (`EventCheckInController::store`). */
export type CheckInResult = {
    status: 'checked_in' | 'already_checked_in';
    check_in: CheckIn;
    /** How many are checked in to the event today. */
    count: number;
};

/** A page of the Recent list (`EventCheckInController::index`). */
export type CheckInPage = {
    data: CheckIn[];
    meta: { next_cursor: string | null };
    count: number;
};
