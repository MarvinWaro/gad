import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { myProfileHref } from '@/lib/my-profile';
import { cn } from '@/lib/utils';
import { show } from '@/routes/people';

/** Where someone's profile is: My Profile for the reader themselves. */
export function useProfileHref() {
    const { auth } = usePage().props;

    return (ulid: string) =>
        ulid === auth.user.ulid ? myProfileHref : show.url(ulid);
}

/** Someone's name, or anything naming them, as a link to their profile. */
export function PersonLink({
    person,
    className,
    children,
}: {
    person: { ulid: string; name: string };
    className?: string;
    children?: ReactNode;
}) {
    const profileHref = useProfileHref();

    return (
        <Link
            href={profileHref(person.ulid)}
            className={cn(
                'rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50',
                className,
            )}
        >
            {children ?? person.name}
        </Link>
    );
}
