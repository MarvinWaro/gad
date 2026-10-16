import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

/**
 * CHED's two views of what institutions owe: what they sent ("Received"),
 * and the institutions that have not sent it yet. Links, so each view has
 * its own address to share or come back to.
 */
export function ReviewViews({
    received,
    notSubmitted,
    current,
}: {
    received: string;
    notSubmitted: string;
    current: 'received' | 'not-submitted';
}) {
    const views = [
        { key: 'received', label: 'Received', href: received },
        {
            key: 'not-submitted',
            label: 'Not yet submitted',
            href: notSubmitted,
        },
    ] as const;

    return (
        <nav aria-label="Views" className="flex gap-1 border-b">
            {views.map((view) => (
                <Link
                    key={view.key}
                    href={view.href}
                    aria-current={view.key === current ? 'page' : undefined}
                    className={cn(
                        '-mb-px flex h-11 items-center rounded-t-sm border-b-2 px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        view.key === current
                            ? 'border-foreground text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    {view.label}
                </Link>
            ))}
        </nav>
    );
}
