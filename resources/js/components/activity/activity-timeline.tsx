import { History } from 'lucide-react';
import { ActivityItem } from '@/components/activity/activity-entry';
import { Pagination } from '@/components/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityPage } from '@/types/activity';

/** An entry's outline while it loads: photo, then a card of three lines. */
function EntrySkeleton() {
    return (
        <div aria-hidden className="flex gap-3 pb-4 sm:gap-4">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2.5 rounded-xl border bg-card p-4">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3.5 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
            </div>
        </div>
    );
}

/**
 * A person's own activity, newest first, for their profile. It arrives just
 * after the page (a deferred prop) and comes in numbered pages; turning a
 * page reloads only the list. The page's prop is named `activity`.
 */
export function ActivityTimeline({ activity }: { activity?: ActivityPage }) {
    if (!activity) {
        return (
            <div aria-busy="true">
                <p role="status" className="sr-only">
                    Loading activity
                </p>
                <EntrySkeleton />
                <EntrySkeleton />
            </div>
        );
    }

    if (activity.data.length === 0) {
        return (
            <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <History aria-hidden className="size-5" />
                </span>
                <p className="mt-4 font-medium">No activity yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Your sign-ins, posts, submissions and changes will appear
                    here as you use PHLGADIS.
                </p>
            </div>
        );
    }

    return (
        <>
            <ol aria-label="Your activity, newest first">
                {activity.data.map((entry, index) => (
                    <ActivityItem
                        key={entry.id}
                        entry={entry}
                        last={index === activity.data.length - 1}
                    />
                ))}
            </ol>
            <Pagination
                page={activity.meta}
                label="entries"
                persistent
                only={['activity']}
                className="rounded-xl border bg-card"
            />
        </>
    );
}
