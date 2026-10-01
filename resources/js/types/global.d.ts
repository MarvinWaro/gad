import type { Auth } from '@/types/auth';
import type { Inbox } from '@/types/notifications';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            /** The bell's count; null when signed out. */
            inbox: Inbox | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
