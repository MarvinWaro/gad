import type {
    PersonRef,
    PostReactionType,
    ReactionSummary,
} from '../types/community';

export type ReactionOption = {
    value: PostReactionType;
    label: string;
    emoji: string;
};

/**
 * The reactions offered on posts, in picker order. App\Enums\PostReactionType
 * is the source of truth (it validates them); keep this list in step with it.
 */
export const POST_REACTIONS: ReactionOption[] = [
    { value: 'heart', label: 'Heart', emoji: '❤️' },
    { value: 'care', label: 'Care', emoji: '🤗' },
    { value: 'clap', label: 'Clap', emoji: '👏' },
];

/** Names in the reactions tooltip; mirrors CommunityFeed::REACTORS_SHOWN. */
export const REACTORS_SHOWN = 10;

export function reactionOption(value: PostReactionType): ReactionOption {
    return (
        POST_REACTIONS.find((option) => option.value === value) ??
        POST_REACTIONS[0]
    );
}

/** The reactions given so far, most given first; ties keep picker order. */
export function usedReactions(summary: ReactionSummary): PostReactionType[] {
    return POST_REACTIONS.map((option) => option.value)
        .filter((value) => summary.counts[value] > 0)
        .sort((a, b) => summary.counts[b] - summary.counts[a]);
}

/**
 * The summary once the viewer reacts (or takes their reaction back, with
 * null), so the card updates before the server answers. The viewer moves
 * to the front of the tooltip's names, as the newest reactor.
 */
export function applyReaction(
    summary: ReactionSummary,
    type: PostReactionType | null,
    viewer: PersonRef,
): ReactionSummary {
    const counts = { ...summary.counts };

    if (summary.mine) {
        counts[summary.mine] -= 1;
    }

    if (type) {
        counts[type] += 1;
    }

    const others = summary.recent.filter((person) => person.id !== viewer.id);

    return {
        total: summary.total - (summary.mine ? 1 : 0) + (type ? 1 : 0),
        counts,
        mine: type,
        recent: type
            ? [{ id: viewer.id, name: viewer.name, type }, ...others].slice(
                  0,
                  REACTORS_SHOWN,
              )
            : others,
    };
}

/** "12 reactions: 7 Heart, 3 Care, 2 Clap", for screen readers. */
export function reactionsLabel(summary: ReactionSummary): string {
    const parts = usedReactions(summary).map(
        (value) => `${summary.counts[value]} ${reactionOption(value).label}`,
    );
    const noun = summary.total === 1 ? 'reaction' : 'reactions';

    return `${summary.total} ${noun}: ${parts.join(', ')}`;
}
