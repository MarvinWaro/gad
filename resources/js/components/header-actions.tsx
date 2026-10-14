import { Link, usePage } from '@inertiajs/react';
import { PanelLeft, PanelTop, ScanQrCode } from 'lucide-react';
import { IconAction } from '@/components/icon-action';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigationStyle } from '@/hooks/use-navigation-style';
import type { NavigationStyle } from '@/hooks/use-navigation-style';
import { cn } from '@/lib/utils';
import { show as scanner } from '@/actions/App/Http/Controllers/Admin/EventScannerController';

const buttonClass = 'size-8 text-muted-foreground hover:text-foreground';

/**
 * The compact icon row beside the account menu: notifications, light/dark,
 * and sidebar/top navigation. Theme and navigation save the same way
 * Settings → Appearance does. With top navigation it also holds the QR
 * scanner, which the sidebar keeps at its foot.
 */
export function HeaderActions({
    navigation,
    className,
}: {
    /** The layout rendering this row, so the switch offers the other one. */
    navigation: NavigationStyle;
    className?: string;
}) {
    const { auth } = usePage().props;
    const { updateStyle } = useNavigationStyle();
    // HEI accounts always get the top header, so they have nothing to switch.
    const canSwitchNavigation = !auth.heiOnly;
    const showsScanner =
        navigation === 'header' && auth.permissions.includes('events.check-in');

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            {showsScanner && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className={buttonClass}
                        >
                            <Link
                                href={scanner()}
                                prefetch
                                aria-label="QR Scanner"
                            >
                                <ScanQrCode className="size-4" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>QR Scanner</TooltipContent>
                </Tooltip>
            )}
            <NotificationBell className={buttonClass} />
            <ThemeToggle className={buttonClass} />
            {canSwitchNavigation && (
                <IconAction
                    label={
                        navigation === 'header'
                            ? 'Switch to sidebar navigation'
                            : 'Switch to top navigation'
                    }
                    onClick={() =>
                        updateStyle(
                            navigation === 'header' ? 'sidebar' : 'header',
                        )
                    }
                    className={buttonClass}
                >
                    {navigation === 'header' ? (
                        <PanelLeft className="size-4" />
                    ) : (
                        <PanelTop className="size-4" />
                    )}
                </IconAction>
            )}
        </div>
    );
}
