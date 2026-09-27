import { usePage } from '@inertiajs/react';
import { useNavigationStyle } from '@/hooks/use-navigation-style';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { isHeiOnly } from '@/lib/app-navigation';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { style } = useNavigationStyle();
    const { auth } = usePage().props;

    // HEI accounts always get the top header; staff keep their preference.
    if (style === 'header' || isHeiOnly(auth.roles ?? [])) {
        return (
            <AppHeaderLayout breadcrumbs={breadcrumbs}>
                {children}
            </AppHeaderLayout>
        );
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppSidebarLayout>
    );
}
