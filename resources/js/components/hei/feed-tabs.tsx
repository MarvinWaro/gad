import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { FeedScope } from '@/types/people';

const scopes: { value: FeedScope; label: string }[] = [
    { value: 'all', label: 'All posts' },
    { value: 'following', label: 'Following' },
];

/**
 * All posts · Following, above the feed: everyone's posts from every region,
 * or only those of the people the reader follows. Plain links (`?feed=`),
 * underlined like the Enrollment | Graduates tabs.
 */
export function FeedTabs({
    scope,
    href,
}: {
    scope: FeedScope;
    /** The page the feed is on, such as the HEI home. */
    href: string;
}) {
    return (
        <nav aria-label="Feed" className="flex gap-1 border-b">
            {scopes.map((option) => (
                <Link
                    key={option.value}
                    href={
                        option.value === 'all'
                            ? href
                            : `${href}?feed=${option.value}`
                    }
                    preserveScroll
                    aria-current={option.value === scope ? 'page' : undefined}
                    className={cn(
                        '-mb-px flex h-11 items-center border-b-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        option.value === scope
                            ? 'border-foreground font-medium text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    {option.label}
                </Link>
            ))}
        </nav>
    );
}
