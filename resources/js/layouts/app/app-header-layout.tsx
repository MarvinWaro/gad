import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
    kiosk = false,
}: AppLayoutProps) {
    // In kiosk mode the top bar steps aside, as in AppSidebarLayout.
    return (
        <AppShell variant="header">
            {!kiosk && <AppHeader breadcrumbs={breadcrumbs} />}
            <AppContent variant="header">{children}</AppContent>
        </AppShell>
    );
}
