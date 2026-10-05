import { Medal } from '@/components/badges/medal';
import { localDate } from '@/lib/manila-time';
import type { QuestBadge, QuestLevel } from '@/types/quests';

/**
 * A GAD Quest level's medal, in the one style every badge shares: plain for
 * finishing, violet for 80% or higher, gold for a perfect score.
 * Decorative: the level's name goes with it.
 */
export function LevelMark({
    level,
    className,
}: {
    level: QuestLevel;
    className?: string;
}) {
    return <Medal kind={level} className={className} />;
}

/** What a quest badge stands for, as the result screen tells it. */
export function BadgeDetails({ badge }: { badge: QuestBadge }) {
    return (
        <div className="flex gap-3">
            <LevelMark level={badge.level} className="size-10" />
            <div className="min-w-0 text-sm">
                <p className="font-medium">
                    {badge.level_label}
                    <span className="sr-only">:</span>{' '}
                    <span className="font-normal text-muted-foreground">
                        {badge.meaning}
                    </span>
                </p>
                <p className="mt-1 text-pretty">{badge.title}</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                    <dt className="text-muted-foreground">Score</dt>
                    <dd className="tabular-nums">
                        {badge.score} of {badge.total} correct
                    </dd>
                    {badge.earned_at && (
                        <>
                            <dt className="text-muted-foreground">Earned</dt>
                            <dd>{localDate(badge.earned_at)}</dd>
                        </>
                    )}
                    <dt className="text-muted-foreground">Organizer</dt>
                    <dd>{badge.organizer}</dd>
                </dl>
            </div>
        </div>
    );
}
