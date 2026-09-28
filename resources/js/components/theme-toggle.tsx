import { Moon, Sun } from 'lucide-react';
import { IconAction } from '@/components/icon-action';
import { useAppearance } from '@/hooks/use-appearance';

/**
 * Flips between light and dark, saving the choice the same way Settings →
 * Appearance does. Shared by the app header and the public site header.
 */
export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <IconAction
            label="Toggle dark mode"
            onClick={() =>
                updateAppearance(
                    resolvedAppearance === 'dark' ? 'light' : 'dark',
                )
            }
            className={className}
        >
            {/* html.dark is set before first paint, so CSS picks the icon
                and the server-rendered markup never disagrees with it. */}
            <Moon className="size-4 dark:hidden" />
            <Sun className="hidden size-4 dark:block" />
        </IconAction>
    );
}
