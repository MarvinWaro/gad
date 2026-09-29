import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            {/* --app-header follows AppSidebarHeader: 64px, or 48px beside
                the icon-only sidebar, and 8px lower on desktop, where the
                page sits in an inset card. */}
            <AppContent
                variant="sidebar"
                className="dot-backdrop min-w-0 overflow-x-clip [--app-header:4rem] group-has-data-[collapsible=icon]/sidebar-wrapper:[--app-header:3rem] md:[--app-header:4.5rem] md:group-has-data-[collapsible=icon]/sidebar-wrapper:[--app-header:3.5rem]"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
