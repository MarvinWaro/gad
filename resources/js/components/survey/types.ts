import type { InertiaFormProps } from '@inertiajs/react';

/** The public survey as PublicSurveyController sends it. */

export type Option = {
    value: string;
    label: string;
    requires_text?: boolean;
    /** A respondent group's own follow-up questions, if any. */
    follow_ups?: FollowUpQuestion[];
};
/**
 * A question a respondent group asks once chosen, written by administrators
 * (App\Support\RespondentFollowUps): a dropdown, or buttons for short lists.
 */
export type FollowUpQuestion = {
    key: string;
    label: string;
    type: 'select' | 'radio';
    required: boolean;
    options: Option[];
};
/** Gender identity and sexual orientation choices, from App\Support\RespondentDetails. */
export type RespondentDetails = {
    /** The same whatever the sex answer. */
    gender_identities: Option[];
    sexual_orientations: Option[];
};
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
};
export type Section = {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
};
export type PublishedSurvey = {
    id: number;
    slug: string;
    code: string;
    title: string;
    law_title: string;
    image_path: string | null;
    version_id: number;
    version: number;
    introduction: string;
    privacy_notice: string;
    consent_text: string;
    retention_days: number;
    definition: { sections: Section[] };
    required: Record<string, 'required' | 'sometimes'>;
};
export type DirectoryItem = { id: number; name: string };
export type Hei = DirectoryItem & { survey_region_id: number };
export type Directories = {
    regions: DirectoryItem[];
    heis: Hei[];
    respondent_groups: Option[];
};

/** Everything a respondent submits. */
export type SurveyAnswers = {
    version_id: number;
    answering_for: string;
    age: string;
    sex: string;
    respondent_group: string;
    respondent_group_other: string;
    gender_identity: string;
    /** Optional, and never asked about a minor. */
    sexual_orientation: string;
    /** Optional; for a minor, the email of the person answering. */
    email: string;
    /** The chosen group's follow-up answers, by question key. */
    group_answers: Record<string, string>;
    /** What was typed for a choice that asks to specify, by question key. */
    group_answer_details: Record<string, string>;
    region_id: string;
    hei_id: string;
    experiences: string[];
    /** Check-all-that-apply answers, keyed by the question's answer key. */
    selections: Record<string, string[]>;
    perpetrators: Record<string, string[]>;
    other_relative_details: Record<string, string>;
    consent: boolean;
    guardian_consent: boolean;
};
export type SurveyAnswersForm = InertiaFormProps<SurveyAnswers>;

/** Messages keyed by the answer at fault, the way the server keys them. */
export type Issues = Record<string, string>;
