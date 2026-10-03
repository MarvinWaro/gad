import type { CalendarEvent } from '@/types';
import type { DirectoryOption } from '@/types/monitoring';
import type { DashboardStudents } from '@/types/statistics';

/** The staff dashboard's filters, as the URL carries them. */
export type DashboardFilters = {
    academic_year: string;
    view: 'year' | 'semester' | 'month';
    semester: string;
    month: string;
    region: string;
    hei: string;
    ownership: string;
    survey: string;
};

export type DashboardPeriod = {
    academic_year: string;
    view: DashboardFilters['view'];
    semester: number | null;
    month: number | null;
    label: string;
    range: string;
    comparison: string;
};

export type Comparable = { value: number; previous: number };

export type BreakdownRow = { value: string; label: string; responses: number };

/** One region, or HEI, or regional office, across the goals. */
export type GoalPlaceRow = {
    id: number;
    name: string;
    kind: 'region' | 'hei' | 'office';
    total: number;
    counts: Record<string, number>;
};

export type HeiRank = {
    id: number;
    name: string;
    region: string | null;
    posts: number;
};

export type GoalFigures = {
    totals: { posts: number; covered: number; heis: number };
    items: { code: string; posts: number }[];
    places: { level: 'region' | 'hei' | null; rows: GoalPlaceRow[] };
    /** Keyed by goal code, plus "all". */
    top_heis: Record<string, HeiRank[]>;
};

export type DashboardProps = {
    period: DashboardPeriod;
    scope: { label: string; national: boolean };
    kpis: {
        responses: Comparable;
        participation: { participating: number; total: number };
        posts: Comparable & { tagged: number };
        accounts: {
            active: number;
            pending: number;
            joined: number;
            hei: number;
            ched: number;
        };
    };
    trend: {
        label: string;
        title: string;
        responses: number;
        /** Original posts, the same count as the GAD posts card. */
        posts: number;
    }[];
    reach: {
        regions: {
            id: number;
            name: string;
            participating: number;
            total: number;
        }[];
        waiting: { count: number; heis: DirectoryOption[] };
    };
    laws: { id: number; code: string; title: string; responses: number }[];
    respondents: { groups: BreakdownRow[]; sexes: BreakdownRow[] };
    community: {
        reactions: number;
        comments: number;
        shares: number;
        contributors: number;
        /** Original posts by who posted them; only the ones with posts. */
        sources: {
            value: 'public' | 'private' | 'unrecorded' | 'ched';
            posts: number;
        }[];
    };
    goals: { sdg: GoalFigures; achieve: GoalFigures };
    /** Enrollment and graduates by sex, from Settings → Statistics. */
    students: DashboardStudents;
    events: CalendarEvent[];
    filters: DashboardFilters;
    options: {
        academicYears: string[];
        surveys: { id: number; code: string }[];
        ownerships: string[];
        regions: DirectoryOption[];
        heis: DirectoryOption[];
    };
    hasOffice: boolean;
};
