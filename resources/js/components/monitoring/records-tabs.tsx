import { Link } from '@inertiajs/react';
import ChecklistResponseController from '@/actions/App/Http/Controllers/Admin/ChecklistResponseController';
import MonitoringReviewController from '@/actions/App/Http/Controllers/Admin/MonitoringReviewController';
import ChecklistController from '@/actions/App/Http/Controllers/ChecklistController';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import { cn } from '@/lib/utils';
import type { ChecklistType } from '@/types/monitoring';

type Tab = 'monitoring' | ChecklistType;

const tabs: { key: Tab; label: string }[] = [
    { key: 'monitoring', label: 'Monitoring' },
    { key: 'training', label: 'Training Survey' },
    { key: 'compliance', label: 'Compliance Survey' },
];

function href(tab: Tab, staff: boolean): string {
    if (tab === 'monitoring') {
        return staff
            ? MonitoringReviewController.index.url()
            : MonitoringController.records.url();
    }

    return staff
        ? ChecklistResponseController.index.url(tab)
        : ChecklistController.show.url(tab);
}

/**
 * The three reports of the old PHLGADIS, as tabs for HEIs (Records) and CHED
 * (Monitoring) alike.
 */
export function RecordsTabs({
    current,
    staff,
}: {
    current: Tab;
    staff: boolean;
}) {
    return (
        <nav
            aria-label={staff ? 'Monitoring' : 'Records'}
            className="-mt-2 flex flex-wrap gap-x-5 border-b text-sm"
        >
            {tabs.map((tab) => {
                const active = tab.key === current;

                return (
                    <Link
                        key={tab.key}
                        href={href(tab.key, staff)}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            '-mb-px inline-flex min-h-11 shrink-0 items-center border-b-2 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                            active
                                ? 'border-foreground font-medium text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
