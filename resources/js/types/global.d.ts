import type { Auth } from '@/types/auth';
import type { Inbox } from '@/types/notifications';
import type { SiteOperator } from '@/types/site';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            /** The office running this site (config/phlgadis.php). */
            operator: SiteOperator;
            auth: Auth;
            /** The bell's count; null when signed out. */
            inbox: Inbox | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
