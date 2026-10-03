import type { InertiaFormProps } from '@inertiajs/react';
import type { SurveyOption } from '@/lib/survey-options';

/** A survey draft as Admin\SurveyController sends it to the builder. */

export type Option = SurveyOption;
export type Question = {
    id: string;
    type: string;
    label: string;
    required: boolean;
    min?: number;
    max?: number;
    /** Option value pre-selected when the form opens, for a single_select. */
    default?: string;
    /** Fix the answer to `default`: shown filled in and not editable. */
    locked?: boolean;
    options?: Option[];
    none_option?: Option;
    perpetrator_options?: Option[];
    /** The builder's own React key, never saved (see withClientKeys). */
    clientKey?: string;
};
export type Section = {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
};
export type Definition = { sections: Section[] };
export type ReadinessCheck = {
    key: string;
    error_key: string;
    label: string;
    passed: boolean;
    detail: string;
    href: string | null;
};
export type BuilderSurvey = {
    id: number;
    code: string;
    slug: string;
    title: string;
    law_title: string;
    image_path: string | null;
    status: string;
    published_version: number | null;
    published_at: string | null;
    public_url: string | null;
};
export type Draft = {
    id: number;
    version: number;
    introduction: string;
    privacy_notice: string;
    consent_text: string;
    retention_days: number | null;
    definition: Definition;
    updated_at: string | null;
};
export type DirectoryStatus = {
    regions: number;
    heis: number;
};
export type Permissions = { update: boolean; publish: boolean };

/** What Save draft sends. */
export type DraftData = {
    title: string;
    law_title: string;
    introduction: string;
    privacy_notice: string;
    consent_text: string;
    retention_days: number | null;
    definition: Definition;
};
export type DraftForm = InertiaFormProps<DraftData>;
