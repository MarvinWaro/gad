import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { index as play } from '@/routes/quests';
import { index as manage } from '@/routes/quests/manage';

/**
 * Play and Manage, for those who both play quests and run them (a CHED
 * Focal). Everyone else sees only their own side, so no tabs.
 */
export function QuestTabs({ current }: { current: 'play' | 'manage' }) {
    const tabs = [
        { key: 'play', label: 'Play', href: play.url() },
        { key: 'manage', label: 'Manage', href: manage.url() },
    ] as const;

    return (
        <nav aria-label="GAD Quest" className="flex gap-1 border-b">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={tab.href}
                    aria-current={tab.key === current ? 'page' : undefined}
                    className={cn(
                        '-mb-px flex h-11 items-center border-b-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        tab.key === current
                            ? 'border-foreground font-medium text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
