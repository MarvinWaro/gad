import { Bell, Moon, Sun } from 'lucide-react';
import { IconAction } from '@/components/icon-action';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

/**
 * The icon row beside the account menu: a notifications bell (a placeholder
 * until notifications ship) and a light/dark switch that saves the choice
 * the same way Settings → Appearance does.
 */
export function HeaderActions({ className }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <IconAction
                label="Notifications (coming soon)"
                aria-disabled="true"
                className="text-muted-foreground hover:text-foreground"
            >
                <Bell className="size-[1.125rem]" />
            </IconAction>
            <IconAction
                label="Toggle dark mode"
                onClick={() =>
                    updateAppearance(
                        resolvedAppearance === 'dark' ? 'light' : 'dark',
                    )
                }
                className="text-muted-foreground hover:text-foreground"
            >
                {/* html.dark is set before first paint, so CSS picks the icon
                    and the server-rendered markup never disagrees with it. */}
                <Moon className="size-[1.125rem] dark:hidden" />
                <Sun className="hidden size-[1.125rem] dark:block" />
            </IconAction>
        </div>
    );
}
