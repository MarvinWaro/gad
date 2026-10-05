import type { Paginated } from '@/components/pagination';

/** `App\Enums\QuestStatus`. */
export type QuestStatus = 'draft' | 'open' | 'closed';

/** `App\Enums\QuestLevel`: the badge a finished quest earns. */
export type QuestLevel = 'participant' | 'advocate' | 'champion';

/**
 * A badge: the best finished attempt at one quest, named and pictured as its
 * level's badge is in Settings → Badges.
 */
export type QuestBadge = {
    quest_id: string;
    title: string;
    level: QuestLevel;
    level_label: string;
    meaning: string;
    /** The level's uploaded picture, shown instead of the medal. */
    image: string | null;
    score: number;
    total: number;
    earned_at: string | null;
    organizer: string;
};

/** A quest in a player's list, and on the HEI home's card. */
export type QuestCard = {
    id: string;
    title: string;
    description: string | null;
    status: QuestStatus;
    organizer: string;
    questions: number;
    allow_retakes: boolean;
    progress: 'new' | 'in_progress' | 'finished';
    best: QuestBadge | null;
};

/** Given only once the player has answered the question. */
export type QuestAnswer = {
    /** The key of the choice they picked. */
    choice: string;
    /** The key of the right choice. */
    correct: string;
    is_correct: boolean;
    explanation: string;
};

export type QuestPlayQuestion = {
    id: number;
    prompt: string;
    /** In this attempt's order, each by an opaque key rather than its id. */
    choices: { key: string; label: string }[];
    answer: QuestAnswer | null;
};

export type QuestAttempt = {
    id: string;
    finished: boolean;
    score: number;
    level: QuestLevel | null;
    started_at: string;
    finished_at: string | null;
    questions: QuestPlayQuestion[];
};

export type QuestPlay = {
    quest: {
        id: string;
        title: string;
        description: string | null;
        status: QuestStatus;
        organizer: string;
        questions: number;
        allow_retakes: boolean;
    };
    attempt: QuestAttempt | null;
    best: QuestBadge | null;
    can: { start: boolean; answer: boolean };
};

/** A question as staff write it: `correct` is the index of the right choice. */
export type QuestQuestionInput = {
    prompt: string;
    explanation: string;
    choices: string[];
    correct: number;
};

/** `QuestResource`: a quest as its staff see it, answers included. */
export type ManagedQuest = {
    id: string;
    title: string;
    description: string | null;
    status: QuestStatus;
    region: { id: number; name: string } | null;
    organizer: string;
    allow_retakes: boolean;
    created_by: string | null;
    published_at: string | null;
    updated_at: string | null;
    players?: number;
    completed?: number;
    played?: boolean;
    questions?: QuestQuestionInput[];
};

export type QuestSummary = {
    questions: number;
    players: number;
    completed: number;
    perfect: number;
    /** The average share answered correctly, 0–100; null before anyone finishes. */
    average: number | null;
    by_sex: { female: number; male: number; not_stated: number };
};

export type QuestParticipant = {
    user_id: number;
    name: string;
    place: string;
    best: number | null;
    level: QuestLevel | null;
    level_label: string | null;
    image: string | null;
    attempts: number;
    last_played: string | null;
};

export type QuestCardPage = Paginated<QuestCard>;
export type QuestParticipantPage = Paginated<QuestParticipant>;
