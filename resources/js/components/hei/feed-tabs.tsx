import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { FeedRegion, FeedScope } from '@/types/people';

const scopes: { value: FeedScope; label: string }[] = [
    { value: 'all', label: 'All posts' },
    { value: 'region', label: 'My region' },
    { value: 'following', label: 'Following' },
];

/**
 * All posts · My region · Following, above the feed: everyone's posts from
 * every region, those of the reader's own region, or those of the people
 * they follow. Readers with no region (the Central Office) get no My region.
 * Plain links (`?feed=`), underlined like the Enrollment | Graduates tabs.
 */
export function FeedTabs({
    scope,
    href,
    region,
}: {
    scope: FeedScope;
    /** The page the feed is on, such as the HEI home. */
    href: string;
    region: FeedRegion;
}) {
    const shown = scopes.filter(
        (option) => option.value !== 'region' || region !== null,
    );

    return (
        <nav aria-label="Feed" className="flex gap-1 border-b">
            {shown.map((option) => (
                <Link
                    key={option.value}
                    href={
                        option.value === 'all'
                            ? href
                            : `${href}?feed=${option.value}`
                    }
                    preserveScroll
                    title={
                        option.value === 'region' && region
                            ? `Posts from ${region.name}`
                            : undefined
                    }
                    aria-current={option.value === scope ? 'page' : undefined}
                    className={cn(
                        '-mb-px flex h-11 items-center border-b-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        option.value === scope
                            ? 'border-foreground font-medium text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    {option.label}
                    {option.value === 'region' && region && (
                        <span className="sr-only">: {region.name}</span>
                    )}
                </Link>
            ))}
        </nav>
    );
}
