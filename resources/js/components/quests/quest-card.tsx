import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { LevelMark } from '@/components/quests/quest-badge';
import { show } from '@/routes/quests';
import type { QuestCard as QuestCardData } from '@/types/quests';

/** What the player can do next with a quest, as its button says it. */
export function questAction(quest: QuestCardData): string {
    switch (quest.progress) {
        case 'in_progress':
            return quest.status === 'open' ? 'Continue' : 'See your answers';
        case 'finished':
            return quest.status === 'open' && quest.allow_retakes
                ? 'Play again'
                : 'See your result';
        default:
            return 'Play';
    }
}

/**
 * A quest in the player's list: who runs it, how long it is, and where they
 * stand with it.
 */
export function QuestCard({ quest }: { quest: QuestCardData }) {
    return (
        <article className="flex flex-col rounded-xl border bg-card p-5">
            <p className="text-[13px] text-muted-foreground">
                {quest.organizer} · {quest.questions} questions
                {quest.status === 'closed' && ' · Closed'}
            </p>
            <h3 className="mt-1 text-lg leading-snug font-medium text-balance">
                {quest.title}
            </h3>
            {quest.description && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {quest.description}
                </p>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                {quest.best ? (
                    <p className="flex items-center gap-2 text-sm">
                        <LevelMark
                            level={quest.best.level}
                            image={quest.best.image}
                            className="size-8"
                        />
                        <span>
                            <span className="font-medium">
                                {quest.best.level_label}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                                {' '}
                                · {quest.best.score} of {quest.best.total}
                            </span>
                        </span>
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {quest.progress === 'in_progress'
                            ? 'You started this quest'
                            : 'About two minutes'}
                    </p>
                )}
                <Button
                    asChild
                    variant={quest.progress === 'new' ? 'default' : 'outline'}
                >
                    <Link
                        href={show.url(quest.id)}
                        aria-label={`${questAction(quest)}: ${quest.title}`}
                    >
                        {questAction(quest)}
                    </Link>
                </Button>
            </div>
        </article>
    );
}
