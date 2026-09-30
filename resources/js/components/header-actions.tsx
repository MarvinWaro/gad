import { usePage } from '@inertiajs/react';
import { Bell, PanelLeft, PanelTop } from 'lucide-react';
import { IconAction } from '@/components/icon-action';
import { ThemeToggle } from '@/components/theme-toggle';
import { useNavigationStyle } from '@/hooks/use-navigation-style';
import type { NavigationStyle } from '@/hooks/use-navigation-style';
import { cn } from '@/lib/utils';

const buttonClass = 'size-8 text-muted-foreground hover:text-foreground';

/**
 * The compact icon row beside the account menu: notifications (a placeholder
 * until they ship), light/dark, and sidebar/top navigation. Theme and
 * navigation save the same way Settings → Appearance does.
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

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            <IconAction
                label="Notifications (coming soon)"
                aria-disabled="true"
                className={buttonClass}
            >
                <Bell className="size-4" />
            </IconAction>
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
