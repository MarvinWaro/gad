export type User = {
    id: number;
    /** Public: profile addresses use it, never `id`. */
    ulid: string;
    name: string;
    email: string;
    avatar?: string | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    roles: string[];
    permissions: string[];
    /** HEI roles only: the HEI home and header shell. */
    heiOnly: boolean;
    /** Plays GAD Quest: everyone with the permission but administrators. */
    playsQuests: boolean;
    /** Where the account belongs: its institution or CHED office. */
    affiliation: string | null;
    /** A staff account's regional office; null for the Central Office and HEIs. */
    officeRegion: string | null;
};

export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
