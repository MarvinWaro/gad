import { Link } from '@inertiajs/react';
import { BetaTag } from '@/components/beta-tag';
import { LevelMark } from '@/components/quests/quest-badge';
import { questAction } from '@/components/quests/quest-card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { index as quests, show as quest } from '@/routes/quests';
import type { QuestCard } from '@/types/quests';

/**
 * The HEI home's GAD Quest card, in the right rail with the other things on
 * now: the newest quest open to them and where they stand with it, or that
 * none is open.
 */
export function GadQuestCard({
    quest: open,
    className,
}: {
    /** The newest quest open to them; null when none is. */
    quest: QuestCard | null;
    className?: string;
}) {
    return (
        <section
            aria-labelledby="gad-quest-title"
            className={cn(
                'relative flex items-center gap-2 overflow-hidden rounded-[10px] border bg-card p-4',
                className,
            )}
        >
            <div className="min-w-0 flex-1">
                <h2
                    id="gad-quest-title"
                    className="flex items-center gap-2 font-medium"
                >
                    GAD Quest
                    <BetaTag />
                </h2>
                {open ? (
                    <>
                        <p className="mt-1 line-clamp-2 text-[13px] leading-snug">
                            {open.title}
                        </p>
                        {open.best && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                <LevelMark
                                    level={open.best.level}
                                    image={open.best.image}
                                    className="size-5"
                                />
                                {open.best.level_label} badge
                            </p>
                        )}
                        <Button asChild size="sm" className="mt-3">
                            <Link
                                href={quest(open.id)}
                                aria-label={`${questAction(open)}: ${open.title}`}
                            >
                                {questAction(open)}
                            </Link>
                        </Button>
                    </>
                ) : (
                    <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                        No quest is open right now.{' '}
                        <Link
                            href={quests()}
                            className="text-foreground underline underline-offset-2"
                        >
                            See your badges
                        </Link>
                    </p>
                )}
            </div>
            <img
                src="/assets/img/persona-card.webp"
                alt=""
                width="240"
                height="201"
                loading="lazy"
                decoding="async"
                className="w-20 shrink-0"
            />
        </section>
    );
}
