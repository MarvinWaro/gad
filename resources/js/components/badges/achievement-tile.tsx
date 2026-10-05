import { Medal } from '@/components/badges/medal';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { localDate } from '@/lib/manila-time';
import type { Achievement } from '@/types/badges';

/**
 * An achievement in a collection, like GitHub's: the medal, its name and
 * (for GAD Quest) its level. Tapping or clicking it tells what it was for,
 * when it was earned and who gave it.
 */
export function AchievementTile({ achievement }: { achievement: Achievement }) {
    return (
        <Popover>
            <PopoverTrigger className="flex h-full w-full flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-colors outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <Medal
                    kind={achievement.medal}
                    image={achievement.image}
                    className="size-14"
                />
                <span className="line-clamp-2 text-sm leading-snug font-medium">
                    {achievement.name}
                </span>
                {achievement.caption && (
                    <span className="text-xs text-muted-foreground">
                        {achievement.caption}
                    </span>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4">
                <div className="flex gap-3">
                    <Medal
                        kind={achievement.medal}
                        image={achievement.image}
                        className="size-11"
                    />
                    <div className="min-w-0 text-sm">
                        <p className="font-medium">
                            {achievement.name}
                            {achievement.caption && (
                                <span className="font-normal text-muted-foreground">
                                    {' '}
                                    · {achievement.caption}
                                </span>
                            )}
                        </p>
                        <p className="mt-1 text-pretty text-muted-foreground">
                            {achievement.description}
                        </p>
                        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                            {achievement.facts.map((fact) => (
                                <div key={fact.label} className="contents">
                                    <dt className="text-muted-foreground">
                                        {fact.label}
                                    </dt>
                                    <dd className="min-w-0 break-words">
                                        {fact.value}
                                    </dd>
                                </div>
                            ))}
                            {achievement.earned_at && (
                                <>
                                    <dt className="text-muted-foreground">
                                        Earned
                                    </dt>
                                    <dd>{localDate(achievement.earned_at)}</dd>
                                </>
                            )}
                        </dl>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
