/** `PersonResource`: someone in search results and follower lists. */
export type Person = {
    id: number;
    name: string;
    avatar: string | null;
    /** Their institution, or their CHED office. */
    affiliation: string;
    /** The reader follows them. */
    following: boolean;
    /** They follow the reader. */
    follows_you: boolean;
    is_you: boolean;
};

/** `PersonProfileResource`: the header of someone's profile. */
export type PersonProfile = Person & {
    deactivated: boolean;
    /** Active accounts only. */
    followers_count: number;
    following_count: number;
    can_follow: boolean;
};

/** What following or unfollowing answers (`FollowController`). */
export type FollowState = { following: boolean; followers_count: number };

/** `App\Enums\FeedScope`: everyone's posts, the reader's region, or the people followed. */
export type FeedScope = 'all' | 'region' | 'following';

/** The reader's region, for the feed's My region tab; null for the Central Office. */
export type FeedRegion = { id: number; name: string } | null;
