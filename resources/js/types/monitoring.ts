export type MonitoringStatus = 'draft' | 'submitted' | 'returned' | 'reviewed';

/** Where a report stands for the people working on it, derived from its status and current revision. */
export type MonitoringStage =
    | 'draft'
    | 'returned'
    | 'ready'
    | 'submitted'
    | 'reviewed';

export type TemplateRun = { text: string; bold?: boolean };

export type TemplateItem = { key: string; label: string };

export type TemplateSection = {
    key: string;
    /** The marker printed on the official form: "1)" … "11)", then "12.". */
    number: string;
    title: string;
    bold: boolean;
    /**
     * single: the section is one row with one answer.
     * rows: a heading row, then one row per lettered item.
     * combined: one row listing the lettered items, with one answer per item.
     */
    layout: 'single' | 'rows' | 'combined';
    detail?: string;
    items: TemplateItem[];
};

/** The official monitoring form, transcribed word for word by the server. */
export type MonitoringTemplate = {
    version: string;
    title: string;
    subtitle: TemplateRun[][];
    columns: { requirements: string; status: string; instruction: string };
    labels: {
        institution: string;
        address: string;
        accomplished_on: string;
        signature: string;
    };
    signatories: { key: SignatoryKey; role: string }[];
    sections: TemplateSection[];
};

export type MonitoringDetails = {
    address: string;
    accomplished_on: string;
    president_name: string;
    focal_person_name: string;
};

export type DetailKey = keyof MonitoringDetails;

export type SignatoryKey = 'president_name' | 'focal_person_name';

/** A regional office's letterhead details. Any of them may still be blank. */
export type RegionOffice = {
    name: string;
    city: string | null;
    address: string | null;
    email: string | null;
    website: string | null;
    phone: string | null;
};

export type DirectoryOption = { id: number; name: string };

export type MonitoringPlace = {
    hei: DirectoryOption;
    cluster: DirectoryOption | null;
    region: DirectoryOption | null;
};

export type MonitoringReview = {
    id: string;
    decision: 'reviewed' | 'returned';
    comment: string | null;
    reviewer: string;
    created_at: string;
};

export type MonitoringRevision = {
    id: string;
    number: number;
    template_version: string;
    details: MonitoringDetails;
    answers: Record<string, string>;
    finalized_at: string | null;
    finalized_by: string | null;
    document_code: string | null;
    submitted_at: string | null;
    submitted_by: string | null;
    attachment: {
        name: string;
        size: number;
        url: string;
        inline_url: string;
    } | null;
    reviews: MonitoringReview[];
};

export type MonitoringReport = {
    id: string;
    academic_year: string;
    semester: 1 | 2;
    status: MonitoringStatus;
    lock_version: number;
    updated_at: string;
    place: MonitoringPlace;
    current: {
        number: number;
        finalized_at: string | null;
        submitted_at: string | null;
    } | null;
    abilities: { edit: boolean; sign: boolean; review: boolean };
    revisions?: MonitoringRevision[];
};

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

export type AcademicPeriod = { academic_year: string; semester: 1 | 2 };
