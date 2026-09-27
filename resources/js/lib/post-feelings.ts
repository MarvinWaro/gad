import type { PostFeeling } from '@/types';

/**
 * The feelings offered in the composer. App\Enums\PostFeeling is the source
 * of truth (it validates and labels posts); keep this list in step with it.
 */
export const POST_FEELINGS: PostFeeling[] = [
    { value: 'happy', label: 'happy', emoji: '😊' },
    { value: 'proud', label: 'proud', emoji: '🏅' },
    { value: 'grateful', label: 'grateful', emoji: '🙏' },
    { value: 'excited', label: 'excited', emoji: '🤩' },
    { value: 'inspired', label: 'inspired', emoji: '🌟' },
    { value: 'hopeful', label: 'hopeful', emoji: '🌷' },
    { value: 'motivated', label: 'motivated', emoji: '💪' },
    { value: 'united', label: 'united', emoji: '🤝' },
];

/** "Ana Cruz", "Ana Cruz and Ben Reyes", or "Ana Cruz and 3 others". */
export function taggedSummary(names: string[]): string {
    if (names.length <= 2) {
        return names.join(' and ');
    }

    return `${names[0]} and ${names.length - 1} others`;
}
