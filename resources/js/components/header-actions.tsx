import { usePage } from '@inertiajs/react';
import { Bell, Moon, PanelLeft, PanelTop, Sun } from 'lucide-react';
import { IconAction } from '@/components/icon-action';
import { useAppearance } from '@/hooks/use-appearance';
import { useNavigationStyle } from '@/hooks/use-navigation-style';
import type { NavigationStyle } from '@/hooks/use-navigation-style';
import { isHeiOnly } from '@/lib/app-navigation';
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
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { updateStyle } = useNavigationStyle();
    // HEI accounts always get the top header, so they have nothing to switch.
    const canSwitchNavigation = !isHeiOnly(auth.roles ?? []);

    return (
        <div className={cn('flex items-center gap-0.5', className)}>
            <IconAction
                label="Notifications (coming soon)"
                aria-disabled="true"
                className={buttonClass}
            >
                <Bell className="size-4" />
            </IconAction>
            <IconAction
                label="Toggle dark mode"
                onClick={() =>
                    updateAppearance(
                        resolvedAppearance === 'dark' ? 'light' : 'dark',
                    )
                }
                className={buttonClass}
            >
                {/* html.dark is set before first paint, so CSS picks the icon
                    and the server-rendered markup never disagrees with it. */}
                <Moon className="size-4 dark:hidden" />
                <Sun className="hidden size-4 dark:block" />
            </IconAction>
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
