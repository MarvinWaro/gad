import AppLogoIcon from '@/components/app-logo-icon';
import { institutionInitials } from '@/lib/institution';
import { cn } from '@/lib/utils';

/**
 * Who a post speaks for: an HEI's acronym on cream, or the PHLGADIS mark for
 * CHED Regional Office XII, so official posts read as official at a glance.
 */
export function SourceAvatar({
    name,
    official = false,
    className,
}: {
    name: string;
    official?: boolean;
    className?: string;
}) {
    if (official) {
        return (
            <span
                aria-hidden
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full border bg-background p-1.5',
                    className,
                )}
            >
                <AppLogoIcon className="size-full object-contain" />
            </span>
        );
    }

    const initials = institutionInitials(name);

    return (
        <span
            aria-hidden
            className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground tabular-nums',
                initials.length > 2 ? 'text-[0.6875rem]' : 'text-sm',
                className,
            )}
        >
            {initials}
        </span>
    );
}
