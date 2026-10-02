import * as React from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import type { AppVariant } from '@/types';

type Props = React.ComponentProps<'main'> & {
    variant?: AppVariant;
};

export function AppContent({ variant = 'sidebar', children, ...props }: Props) {
    if (variant === 'sidebar') {
        return <SidebarInset {...props}>{children}</SidebarInset>;
    }

    // Pages read best in a 1280px column; a page that lays out its own
    // columns across the screen (the HEI home) marks itself data-layout="wide".
    return (
        <main
            className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl has-[>[data-layout=wide]]:max-w-none"
            {...props}
        >
            {children}
        </main>
    );
}
