import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children, variant = 'sidebar' }: Props) {
    const isOpen = usePage().props.sidebarOpen;

    if (variant === 'header') {
        // Where AppHeader's sticky bar ends: the brand bar on phones (h-14
        // plus its border), the navigation row from lg (h-12 plus its border).
        return (
            <div className="dot-backdrop flex min-h-screen w-full flex-col [--app-header:3.5625rem] lg:[--app-header:3.0625rem]">
                {children}
            </div>
        );
    }

    return <SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider>;
}
