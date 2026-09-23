import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
    current_page: number;
    last_page: number;
};

/**
 * Page controls for a Laravel paginator.
 *
 * Laravel's first and last links carry HTML arrow entities as their label, so
 * they are rendered as icons and the numbered links keep their own text.
 */
export function Pagination({
    page,
    label = 'results',
    className,
}: {
    page: Paginated<unknown>;
    label?: string;
    className?: string;
}) {
    if (page.last_page <= 1) {
        return null;
    }

    const [previous, ...rest] = page.links;
    const next = rest.pop();
    const numbered = rest;

    return (
        <nav
            aria-label="Pagination"
            className={cn(
                'flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                className,
            )}
        >
            <p className="text-sm text-muted-foreground">
                Showing {page.from ?? 0}–{page.to ?? 0} of {page.total} {label}
            </p>
            <div className="flex flex-wrap items-center gap-1">
                <PageLink link={previous} label="Previous page">
                    <ChevronLeft />
                </PageLink>
                {numbered.map((link, index) => (
                    <PageLink
                        key={`${link.label}-${index}`}
                        link={link}
                        label={`Page ${link.label}`}
                    >
                        {link.label}
                    </PageLink>
                ))}
                <PageLink link={next} label="Next page">
                    <ChevronRight />
                </PageLink>
            </div>
        </nav>
    );
}

function PageLink({
    link,
    label,
    children,
}: {
    link?: PaginationLink;
    label: string;
    children: React.ReactNode;
}) {
    if (!link) {
        return null;
    }
    if (link.url === null) {
        return (
            <Button variant="ghost" size="sm" disabled aria-label={label}>
                {children}
            </Button>
        );
    }

    return (
        <Button
            asChild
            size="sm"
            variant={link.active ? 'secondary' : 'ghost'}
            aria-current={link.active ? 'page' : undefined}
        >
            <Link href={link.url} preserveScroll aria-label={label}>
                {children}
            </Link>
        </Button>
    );
}
