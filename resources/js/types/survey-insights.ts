import type {
    BreakdownRow,
    Comparable,
    DashboardFilters,
    DashboardPeriod,
    DashboardProps,
} from '@/types/dashboard';

/** `SurveyStatistics::overview`: the Surveys page's insights. */
export type SurveyInsights = {
    period: DashboardPeriod;
    scope: { label: string; national: boolean };
    kpis: {
        responses: Comparable;
        participation: { participating: number; total: number };
        /** Surveys the public can answer now. */
        live: number;
    };
    trend: { label: string; title: string; responses: number }[];
    laws: DashboardProps['laws'];
    respondents: { groups: BreakdownRow[]; sexes: BreakdownRow[] };
    /** Regions when every region is in view, otherwise the top HEIs. */
    places: {
        level: 'region' | 'hei';
        rows: { id: number | null; name: string; responses: number }[];
        total: number;
    };
};

/** `SurveyStatistics::overviewFilters`, sent with the page. */
export type SurveyInsightFilters = Pick<
    DashboardProps,
    'filters' | 'options'
> & {
    hasOffice: boolean;
};

/** One answer of a question, split by sex where the question allows. */
export type AnswerOption = {
    value: string;
    label: string;
    count: number;
    female: number | null;
    male: number | null;
    /** Who was responsible, for an experience. */
    details: { value: string; label: string; count: number }[];
};

export type AnswerQuestion = {
    key: string;
    label: string;
    group: 'answers' | 'respondents';
    kind: 'matrix' | 'choices';
    options: AnswerOption[];
};

export type SummaryFilters = Omit<DashboardFilters, 'ownership' | 'survey'> & {
    sex: string;
    respondent_group: string;
};

/** `SurveyStatistics::summary`: one survey's Summary page. */
export type SurveySummary = {
    survey: { id: number; code: string; title: string; law_title: string };
    period: DashboardPeriod;
    scope: { label: string; national: boolean };
    totals: { responses: number; heis: number; female: number; male: number };
    /** Too few responses in view to show answers. */
    suppressed: boolean;
    questions: AnswerQuestion[];
    filters: SummaryFilters;
    options: DashboardProps['options'] & {
        sexes: Record<string, string>;
        groups: { value: string; label: string }[];
    };
    minResponses: number;
    hasOffice: boolean;
};
