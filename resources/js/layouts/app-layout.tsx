import { usePage } from '@inertiajs/react';
import { useNavigationStyle } from '@/hooks/use-navigation-style';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    kiosk = false,
    children,
}: AppLayoutProps) {
    const { style } = useNavigationStyle();
    const { auth } = usePage().props;

    // HEI accounts always get the top header; staff keep their preference.
    if (style === 'header' || auth.heiOnly) {
        return (
            <AppHeaderLayout breadcrumbs={breadcrumbs} kiosk={kiosk}>
                {children}
            </AppHeaderLayout>
        );
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} kiosk={kiosk}>
            {children}
        </AppSidebarLayout>
    );
}
