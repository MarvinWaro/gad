import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { institutionInitials } from '@/lib/institution';
import { cn } from '@/lib/utils';

/**
 * Who a post speaks for: the author's profile photo when they have one
 * (the school's name always sits beside it), otherwise an HEI's acronym on
 * cream, or the PHLGADIS mark for CHED Regional Office XII.
 */
export function SourceAvatar({
    name,
    official = false,
    photo,
    className,
}: {
    name: string;
    official?: boolean;
    /** The author's profile photo URL, if they uploaded one. */
    photo?: string | null;
    className?: string;
}) {
    if (photo) {
        return (
            <Avatar
                aria-hidden
                className={cn('size-10 shrink-0 rounded-full', className)}
            >
                <AvatarImage src={photo} alt="" className="object-cover" />
                <AvatarFallback className="rounded-full bg-accent text-xs text-accent-foreground">
                    {institutionInitials(name)}
                </AvatarFallback>
            </Avatar>
        );
    }

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
                initials.length > 2 ? 'text-xs' : 'text-sm',
                className,
            )}
        >
            {initials}
        </span>
    );
}
