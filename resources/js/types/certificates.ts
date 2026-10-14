import type { PaginationMeta } from '@/components/pagination';
import type { CalendarEvent } from '@/types';
import type { DirectoryOption } from '@/types/monitoring';

/** `App\Enums\CertificateKind`. */
export type CertificateKind = 'participation' | 'appearance';

/** A kind as the editor offers it, with the words a new design starts with. */
export type CertificateKindOption = {
    value: CertificateKind;
    title: string;
    lead: string;
    body: string;
};

/** A regional office's letterhead lines, for the preview. */
export type CertificateOffice = {
    id: number;
    name: string;
    city: string | null;
};

/** `CertificateSignatoryResource`. */
export type Signatory = {
    id: string;
    name: string;
    position: string;
    region: DirectoryOption | null;
    /** A signed link to the e-signature, good for two hours. */
    signature: string;
    designs?: number;
    can: { update: boolean; delete: boolean };
};

export type SignatoryPage = { data: Signatory[]; meta: PaginationMeta };

/** `CertificateDesignResource`. */
export type CertificateDesign = {
    id: string;
    kind: CertificateKind;
    title: string;
    name: string;
    background: string;
    body: string;
    region: DirectoryOption | null;
    /** `key` names the logo when saving which ones stay. */
    logos: { key: string; url: string }[];
    signatories?: Pick<Signatory, 'id' | 'name' | 'position' | 'signature'>[];
    /** Its pair, of the other kind, in the editor: chosen and released with it. */
    partner?: { id: string; name: string; title: string } | null;
    uses?: number;
    released_uses?: number;
    updated_at: string | null;
    can: { update: boolean; delete: boolean; use: boolean; pair: boolean };
};

export type CertificateDesignPage = {
    data: CertificateDesign[];
    meta: PaginationMeta;
};

/** `EventCertificateResource`: a design used on an event. */
export type EventCertificate = {
    id: string;
    kind: CertificateKind | null;
    title: string | null;
    design: { id: string; name: string } | null;
    event: (CalendarEvent & { region: string | null }) | null;
    released_at: string | null;
    released_by: string | null;
    /** People checked in. */
    eligible?: number;
    issued?: number;
    withdrawn?: number;
    can: { release: boolean };
};

/** `CertificateHolderResource`. */
export type CertificateHolder = {
    id: string;
    number: string;
    name: string;
    affiliation: string | null;
    region: string | null;
    /** A guest without an account, whose certificate staff hand over. */
    guest: boolean;
    issued_at: string;
    withdrawn_at: string | null;
    withdrawn_by: string | null;
};

export type CertificateHolderPage = {
    data: CertificateHolder[];
    meta: PaginationMeta;
};

/** `CertificateRequestResource`: someone who missed a day asking for a certificate. */
export type CertificateRequest = {
    id: string;
    /** The event certificate asked for. */
    certificate_id: string;
    /** Its kind, on the asker's event page. */
    title?: string | null;
    reason: string;
    status: 'pending' | 'approved' | 'declined';
    /** The office's note when it declined. */
    note: string | null;
    requested_at: string;
    decided_at: string | null;
    /** For staff. */
    person?: {
        name: string;
        avatar: string | null;
        affiliation: string | null;
    };
    /** The days they were checked in, Y-m-d, for staff. */
    days?: string[];
};

export type CertificateRequestPage = {
    data: CertificateRequest[];
    meta: PaginationMeta;
};

/** A released certificate of an event someone may ask for. */
export type RequestableCertificate = { id: string; title: string };

/** What a certificate printed about its event, as it was released. */
export type CertificateEvent = {
    title: string;
    starts_at: string;
    ends_at: string | null;
    is_all_day: boolean;
    location: string | null;
};

/** `MyCertificateResource`. */
export type MyCertificate = {
    id: string;
    number: string;
    kind: CertificateKind | null;
    title: string | null;
    event: CertificateEvent | null;
    office: string | null;
    issued_at: string;
    verify_url: string;
};

export type MyCertificatePage = { data: MyCertificate[]; meta: PaginationMeta };

/** `CertificateDocumentResource`: everything one certificate prints. */
export type CertificateDocument = {
    number: string;
    verify_url: string;
    /** The verify QR's modules, a string of 0s and 1s per row (1 is dark). */
    qr: string[];
    kind: CertificateKind;
    title: string;
    lead: string;
    /** In capitals already. */
    name: string;
    affiliation: string | null;
    background: string | null;
    body: string;
    event: CertificateEvent | null;
    office: { name: string; city: string | null } | null;
    /** The Philippine days they were checked in, Y-m-d. */
    days: string[];
    released_on: string;
    /** Picture links: signed links, or the editor's own files. */
    logos: string[];
    signatories: { name: string; position: string; signature: string }[];
};

/** `CertificateVerificationResource`. */
export type CertificateVerification = {
    number: string;
    status: 'valid' | 'withdrawn';
    kind: CertificateKind | null;
    title: string | null;
    name: string;
    affiliation: string | null;
    event: CertificateEvent | null;
    office: string;
    issued_on: string;
    withdrawn_on: string | null;
};
