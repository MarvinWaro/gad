import { useHttp } from '@inertiajs/react';
import { ChevronDown, UserCheck, UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { follow, unfollow } from '@/routes/people';
import type { FollowState } from '@/types/people';

/**
 * Follow someone, as on Facebook: "Follow", then "Following", whose menu
 * holds "Unfollow", so a stray tap never unfollows. Their posts then fill
 * the reader's Following feed, and they are told.
 */
export function FollowButton({
    person,
    onChange,
    className,
}: {
    person: { ulid: string; name: string; following: boolean };
    /** The answer, such as to update a follower count. */
    onChange?: (state: FollowState) => void;
    className?: string;
}) {
    const [following, setFollowing] = useState(person.following);
    const request = useHttp<Record<string, never>, FollowState>({});
    const options = {
        onSuccess: (state: FollowState) => {
            setFollowing(state.following);
            onChange?.(state);
        },
        onHttpException: () => {
            toast.error('That did not go through. Try again.');
        },
        onNetworkError: () => {
            toast.error('You appear to be offline.');
        },
    };

    function start() {
        request
            .post(follow.url(person.ulid), options)
            // Failures are told above.
            .catch(() => undefined);
    }

    function stop() {
        request
            .delete(unfollow.url(person.ulid), options)
            .catch(() => undefined);
    }

    if (!following) {
        return (
            <Button
                type="button"
                disabled={request.processing}
                onClick={start}
                className={className}
            >
                {request.processing ? <Spinner /> : <UserPlus aria-hidden />}
                Follow
                <span className="sr-only"> {person.name}</span>
            </Button>
        );
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={request.processing}
                    className={cn('gap-1.5', className)}
                >
                    {request.processing ? (
                        <Spinner />
                    ) : (
                        <UserCheck aria-hidden />
                    )}
                    Following
                    <span className="sr-only"> {person.name}</span>
                    <ChevronDown aria-hidden className="size-4 opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={stop}>
                    <UserMinus />
                    Unfollow {person.name}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
