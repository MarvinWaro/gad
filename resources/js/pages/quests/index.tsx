import { Head } from '@inertiajs/react';
import { Gamepad2 } from 'lucide-react';
import { BetaTag } from '@/components/beta-tag';
import { Pagination } from '@/components/pagination';
import { AchievementTile } from '@/components/badges/achievement-tile';
import { QuestCard } from '@/components/quests/quest-card';
import { QuestTabs } from '@/components/quests/quest-tabs';
import type { Achievement } from '@/types/badges';
import type { QuestCardPage } from '@/types/quests';

/**
 * GAD Quest for its players: the quests open to them (and closed ones they
 * played), then every badge they have earned.
 */
export default function Quests({
    quests,
    achievements,
    canManage,
}: {
    quests: QuestCardPage;
    /** Their GAD Quest badges. */
    achievements: Achievement[];
    canManage: boolean;
}) {
    return (
        <>
            <Head title="GAD Quest" />
            <div className="w-full px-4 pb-20 sm:px-6 lg:px-8">
                <header className="pt-8 pb-6 sm:pt-12">
                    <h1 className="flex items-center gap-2 text-[1.75rem] leading-tight font-normal sm:text-[2rem]">
                        GAD Quest
                        <BetaTag />
                    </h1>
                    <p className="mt-2 max-w-prose text-sm text-muted-foreground">
                        Short quizzes on gender and development from CHED, for
                        GAD activities and campaigns. Each answer is explained
                        as you go, and finishing earns a badge for your profile.
                    </p>
                </header>

                {canManage && (
                    <div className="mb-6">
                        <QuestTabs current="play" />
                    </div>
                )}

                <section aria-labelledby="open-quests">
                    <h2 id="open-quests" className="sr-only">
                        Quests
                    </h2>
                    {quests.data.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {quests.data.map((quest) => (
                                <QuestCard key={quest.id} quest={quest} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-12 text-center">
                            <span className="flex size-12 items-center justify-center rounded-full bg-brand-soft text-brand">
                                <Gamepad2 aria-hidden className="size-5" />
                            </span>
                            <p className="mt-4 font-medium">
                                No quest is open right now
                            </p>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                CHED opens quests for GAD activities such as
                                Women&rsquo;s Month. The next one will show
                                here.
                            </p>
                        </div>
                    )}
                    <Pagination
                        page={quests}
                        label="quests"
                        className="mt-4 border-t-0 px-0"
                    />
                </section>

                <section aria-labelledby="badges" className="mt-12">
                    <h2 id="badges" className="text-lg font-medium">
                        Your badges
                    </h2>
                    {achievements.length > 0 ? (
                        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                            {achievements.map((badge) => (
                                <li key={badge.key}>
                                    <AchievementTile achievement={badge} />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Finish a quest to earn your first badge. It stays on
                            your profile.
                        </p>
                    )}
                </section>
            </div>
        </>
    );
}

Quests.layout = {
    breadcrumbs: [{ title: 'GAD Quest', href: '/quests' }],
};
