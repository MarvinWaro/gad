import type { PaginationMeta } from '@/components/pagination';
import type { DirectoryOption } from '@/types/monitoring';

/** The website feedback form's questions, from App\Support\FeedbackQuestions. */
export type FeedbackQuestions = {
    /** Choose-one questions, stored as the option's number. */
    choices: {
        key: string;
        label: string;
        options: { value: number; label: string }[];
    }[];
    /** 1-to-5 scales, a step each. */
    scales: {
        key: string;
        /** The step's name. */
        title: string;
        intro: string;
        low: string;
        high: string;
        items: { key: string; label: string }[];
    }[];
};

export type FeedbackTypeOption = { code: string; label: string };

/** An institution the visitor can pick, with the region it sits in. */
export type FeedbackHei = DirectoryOption & { region_id: number };

/** The form's answers; scores are keyed by question and kept as strings. */
export type FeedbackAnswers = {
    type: string;
    feedback: string;
    suggestions: string;
    email: string;
    name: string;
    region_id: string;
    hei_id: string;
    /** Hidden from people; a bot that fills it is ignored. */
    website: string;
} & Record<string, string>;

/** One feedback as staff read it (App\Http\Resources\SiteFeedbackResource). */
export type SiteFeedback = {
    id: string;
    type: FeedbackTypeOption;
    feedback: string;
    suggestions: string | null;
    answers: Record<string, number | null>;
    contact: { name: string | null; email: string | null };
    place: {
        region: string | null;
        cluster: string | null;
        hei: string | null;
    };
    submitted_at: string;
};

export type SiteFeedbackPage = {
    data: SiteFeedback[];
    meta: PaginationMeta;
};

export type FeedbackScore = {
    average: number | null;
    answers: number;
    /** How many gave each value, from 1 up. */
    counts: number[];
};

export type FeedbackSummary = {
    total: number;
    with_contact: number;
    types: (FeedbackTypeOption & { count: number })[];
    scores: Record<string, FeedbackScore>;
    /** Each scale's average over all of its answers. */
    scales: Record<string, number | null>;
};

export type FeedbackFilters = {
    type?: string;
    region?: string;
    cluster?: string;
    hei?: string;
    search?: string;
};
