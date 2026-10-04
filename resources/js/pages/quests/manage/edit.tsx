import { Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { BetaTag } from '@/components/beta-tag';
import { QuestForm } from '@/components/quests/quest-form';
import type { QuestLimits } from '@/components/quests/quest-form';
import { index, show } from '@/routes/quests/manage';
import type { DirectoryOption } from '@/types/monitoring';
import type { ManagedQuest } from '@/types/quests';

/**
 * GAD Quest → New quest, or Edit quest: its title, who plays it, and its
 * five questions with their answers and explanations.
 */
export default function EditQuest({
    quest,
    regions,
    nationalAccess,
    limits,
}: {
    quest: ManagedQuest | null;
    regions: DirectoryOption[];
    nationalAccess: boolean;
    limits: QuestLimits;
    canPlay: boolean;
}) {
    const title = quest ? 'Edit quest' : 'New quest';

    return (
        <>
            <Head title={title} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <Link
                        href={quest ? show.url(quest.id) : index.url()}
                        className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <ChevronLeft aria-hidden className="size-4" />
                        {quest ? quest.title : 'GAD Quest'}
                    </Link>
                    <h1 className="mt-2 flex items-center gap-2 text-3xl font-medium tracking-tight">
                        {title}
                        <BetaTag />
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                        {limits.questions} easy questions on a law, a GAD topic
                        or an event. Each player sees one question at a time,
                        then whether they were right and why. Finishing earns a
                        badge for their profile.
                    </p>
                </header>
                <div className="max-w-3xl">
                    <QuestForm
                        quest={quest}
                        regions={regions}
                        nationalAccess={nationalAccess}
                        limits={limits}
                    />
                </div>
            </div>
        </>
    );
}

EditQuest.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'GAD Quest', href: '/quests/manage' },
    ],
};
