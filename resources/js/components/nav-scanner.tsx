import { Link, usePage } from '@inertiajs/react';
import { ScanQrCode } from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
// The controller's own route file: '@/routes/admin' would bring every admin
// route into the bundle each page loads.
import { show as scanner } from '@/actions/App/Http/Controllers/Admin/EventScannerController';

/**
 * The QR scanner at the foot of the sidebar, above the account, for staff
 * who check people in at GAD events (`events.check-in`).
 */
export function NavScanner() {
    const { auth } = usePage().props;
    const { isCurrentUrl } = useCurrentUrl();

    if (!auth.permissions.includes('events.check-in')) {
        return null;
    }

    const current = isCurrentUrl(scanner());

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={current}
                    tooltip={{ children: 'QR Scanner' }}
                >
                    <Link
                        href={scanner()}
                        prefetch
                        aria-current={current ? 'page' : undefined}
                    >
                        <ScanQrCode />
                        <span>QR Scanner</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
