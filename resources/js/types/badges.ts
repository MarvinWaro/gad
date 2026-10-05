import type { PaginationMeta } from '@/components/pagination';
import type { QuestLevel } from '@/types/quests';

/**
 * The medal drawn for a badge without a picture: a GAD Quest level, a
 * system badge's rule (`App\Enums\BadgeRule`), or `custom`.
 */
export type MedalKind =
    | 'participant'
    | 'advocate'
    | 'champion'
    | 'community-spark'
    | 'visual-storyteller'
    | 'sdg-connector'
    | 'agenda-builder'
    | 'custom';

/** `App\Support\Achievements`: a badge or GAD Quest badge someone holds. */
export type Achievement = {
    key: string;
    name: string;
    /** A GAD Quest level; null for a badge. */
    caption: string | null;
    description: string;
    medal: MedalKind;
    /** An uploaded picture shown instead of the medal. */
    image: string | null;
    earned_at: string | null;
    facts: { label: string; value: string }[];
};

/** `BadgeResource`: a badge in Settings → Badges. */
export type BadgeRow = {
    id: string;
    /** Earned by this rule; null for a badge awarded by hand. */
    rule: string | null;
    /** A GAD Quest level's own row; null for every other badge. */
    quest_level: QuestLevel | null;
    criterion: string | null;
    name: string;
    description: string;
    medal: MedalKind;
    image: string | null;
    is_active: boolean;
    region: { id: number; name: string } | null;
    holders?: number;
    /** `switch`: whether it can be switched off; GAD Quest levels stay on. */
    can: { update: boolean; switch: boolean; delete: boolean; award: boolean };
};

/** `BadgeAwardResource`: someone holding a badge. */
export type BadgeHolder = {
    id: number;
    person: { id: number; name: string; avatar: string | null; place: string };
    awarded_by: string | null;
    note: string | null;
    awarded_at: string;
};

export type BadgePage = { data: BadgeRow[]; meta: PaginationMeta };
export type BadgeHolderPage = { data: BadgeHolder[]; meta: PaginationMeta };

/** `Achievements::questLevels`: a GAD Quest level's badge, by its name in Settings → Badges. */
export type QuestLevelBadge = {
    level: QuestLevel;
    name: string;
    image: string | null;
};

/** `Achievements::toEarn`: a badge for sharing GAD work not earned yet. */
export type BadgeToEarn = {
    key: string;
    name: string;
    description: string;
    /** How it is earned. */
    criterion: string;
    medal: MedalKind;
    image: string | null;
};
