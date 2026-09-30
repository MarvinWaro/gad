import { usePage } from '@inertiajs/react';
import { useNavigationStyle } from '@/hooks/use-navigation-style';
import { isMyProfileView, myProfileHref } from '@/lib/my-profile';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { style } = useNavigationStyle();
    const page = usePage();
    const { auth } = page.props;
    const pageBreadcrumbs = isMyProfileView(page.url)
        ? [{ title: 'My Profile', href: myProfileHref }]
        : breadcrumbs;

    // HEI accounts always get the top header; staff keep their preference.
    if (style === 'header' || auth.heiOnly) {
        return (
            <AppHeaderLayout breadcrumbs={pageBreadcrumbs}>
                {children}
            </AppHeaderLayout>
        );
    }

    return (
        <AppSidebarLayout breadcrumbs={pageBreadcrumbs}>
            {children}
        </AppSidebarLayout>
    );
}
