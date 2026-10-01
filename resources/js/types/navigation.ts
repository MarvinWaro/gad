import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

/** Navigation items under one label, as the sidebar groups them. */
export type NavGroup = {
    label: string;
    items: NavItem[];
    /** The top navigation shows the group as one menu, named by its label. */
    menu?: boolean;
    icon?: LucideIcon | null;
};
