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

/**
 * Someone's name, or anything naming them, as a link to their profile.
 * `tabIndex={-1}` makes it a second way there for the pointer only, beside
 * the link keyboards use.
 */
export function PersonLink({
    person,
    className,
    children,
    tabIndex,
    'aria-hidden': ariaHidden,
}: {
    person: { ulid: string; name: string };
    className?: string;
    children?: ReactNode;
    tabIndex?: number;
    'aria-hidden'?: boolean;
}) {
    const profileHref = useProfileHref();

    return (
        <Link
            href={profileHref(person.ulid)}
            tabIndex={tabIndex}
            aria-hidden={ariaHidden}
            className={cn(
                'rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50',
                className,
            )}
        >
            {children ?? person.name}
        </Link>
    );
}

/**
 * Someone's photo as a way to their profile, as Facebook has it, beside the
 * link on their name: for the pointer only, so keyboards and screen readers
 * meet each person once.
 */
export function PersonPhotoLink({
    person,
    className,
    children,
}: {
    person: { ulid: string; name: string };
    className?: string;
    children: ReactNode;
}) {
    return (
        <PersonLink
            person={person}
            tabIndex={-1}
            aria-hidden
            className={cn('flex shrink-0 rounded-full', className)}
        >
            {children}
        </PersonLink>
    );
}
