import { usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

/**
 * The signed-in account in the sidebar and the account menu: photo, name,
 * where it belongs (its institution or CHED office, such as "CHED Regional
 * Office XII"), and the email in the menu.
 */
export function UserInfo({
    user,
    showEmail = false,
}: {
    user: User;
    showEmail?: boolean;
}) {
    const getInitials = useInitials();
    const { affiliation } = usePage().props.auth;

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage
                    src={user.avatar ?? undefined}
                    alt={user.name}
                    className="object-cover"
                />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
                {affiliation && (
                    <span
                        data-test="user-affiliation"
                        className="truncate text-xs text-muted-foreground"
                    >
                        {affiliation}
                    </span>
                )}
            </div>
        </>
    );
}
