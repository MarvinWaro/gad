export type MonitoringStatus = 'draft' | 'submitted' | 'returned' | 'reviewed';
export type MonitoringTemplate = {
    version: string;
    title: string;
    subtitle: string;
    sections: {
        key: string;
        title: string;
        number?: number;
        standalone?: boolean;
        items: { key: string; label: string; detail?: string }[];
    }[];
};
export type MonitoringRevision = {
    id: string;
    number: number;
    template: MonitoringTemplate;
    address: string;
    accomplished_on: string;
    president_name: string;
    focal_person_name: string;
    submitted_at: string | null;
    institution: { name: string; region: string; cluster: string } | null;
    answers: Record<string, string>;
    legacy_overview: string | null;
    legacy_opportunity: string | null;
    attachment: { name: string; size: number; url: string } | null;
    reviews: {
        id: string;
        decision: 'reviewed' | 'returned';
        comment: string | null;
        reviewer: string;
        created_at: string;
    }[];
};
export type MonitoringReport = {
    id: string;
    institution_name: string;
    region_name?: string;
    cluster_name?: string;
    academic_year: string;
    semester: number;
    status: MonitoringStatus;
    lock_version: number;
    updated_at: string;
    can_edit: boolean;
    can_review: boolean;
    revisions: MonitoringRevision[];
};
export type DirectoryOption = { id: number; name: string };
export type ReportFilters = {
    academic_year?: string;
    semester?: string;
    status?: string;
    region?: string;
    cluster?: string;
    hei?: string;
    search?: string;
};
export type MonitoringPage = {
    data: MonitoringReport[];
    meta: { current_page: number; last_page: number; total: number };
    links: { prev: string | null; next: string | null };
};
