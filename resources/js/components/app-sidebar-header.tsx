import { Breadcrumbs } from '@/components/breadcrumbs';
import { HeaderActions } from '@/components/header-actions';
import { HeaderSearch } from '@/components/header-search';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

/**
 * The top bar beside the sidebar. It sticks while the page scrolls: at the
 * top on phones, and on desktop just inside the inset card's frame, where
 * the cap behind it hides what scrolls past above it and around its
 * rounded corners.
 */
export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-30 shrink-0 md:top-2">
            <div
                aria-hidden
                className="absolute inset-x-0 -top-2 hidden h-6 bg-sidebar md:block"
            />
            <div className="relative flex h-16 items-center gap-2 border-b border-sidebar-border/50 bg-background px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:rounded-t-xl md:px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <HeaderSearch placement="sidebar" />
                    <HeaderActions navigation="sidebar" />
                </div>
            </div>
        </header>
    );
}
