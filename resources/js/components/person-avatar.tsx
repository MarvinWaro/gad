import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';

/**
 * A person's profile photo, falling back to their initials when they have
 * none (or it fails to load). Decorative: the name always sits beside it.
 */
export function PersonAvatar({
    name,
    src,
    className,
    fallbackClassName,
}: {
    name: string;
    src?: string | null;
    className?: string;
    /** E.g. a larger text size for big avatars. */
    fallbackClassName?: string;
}) {
    const getInitials = useInitials();

    return (
        <Avatar
            aria-hidden
            className={cn('size-8 shrink-0 rounded-full', className)}
        >
            {src && <AvatarImage src={src} alt="" className="object-cover" />}
            <AvatarFallback
                className={cn(
                    'rounded-full bg-accent text-xs text-accent-foreground',
                    fallbackClassName,
                )}
            >
                {getInitials(name)}
            </AvatarFallback>
        </Avatar>
    );
}
