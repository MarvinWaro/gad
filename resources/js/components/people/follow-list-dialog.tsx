import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PersonAvatar } from '@/components/person-avatar';
import { PersonLink } from '@/components/people/person-link';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { followers, following } from '@/routes/people';
import type { Person } from '@/types/people';

type Kind = 'followers' | 'following';

type PeoplePage = { data: Person[]; links: { next: string | null } };

/**
 * "12 followers" or "3 following" on a profile, opening the people, the
 * latest first, twenty at a time, in the Reactions dialog's frame.
 */
export function FollowListDialog({
    person,
    kind,
    count,
}: {
    person: { id: number; name: string };
    kind: Kind;
    count: number;
}) {
    const title = kind === 'followers' ? 'Followers' : 'Following';
    const words =
        kind === 'followers'
            ? count === 1
                ? 'follower'
                : 'followers'
            : 'following';

    return (
        <Dialog>
            <DialogTrigger className="rounded-sm text-sm text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span className="font-medium text-foreground tabular-nums">
                    {count.toLocaleString()}
                </span>{' '}
                {words}
            </DialogTrigger>
            <DialogContent
                showCloseButton={false}
                className="flex max-h-[min(85dvh,40rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[28rem]"
            >
                <header className="relative flex h-15 shrink-0 items-center justify-center border-b px-14">
                    <DialogTitle className="text-base font-medium">
                        {title}
                    </DialogTitle>
                    <DialogClose className="absolute right-3 flex size-9 items-center justify-center rounded-full bg-muted outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50">
                        <X aria-hidden className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </header>
                <DialogDescription className="sr-only">
                    {kind === 'followers'
                        ? `People who follow ${person.name}, the latest first.`
                        : `People ${person.name} follows, the latest first.`}
                </DialogDescription>
                <div className="min-h-0 overflow-y-auto">
                    <PeopleList personId={person.id} kind={kind} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

type Loaded = { page: number; people: Person[]; more: boolean };

function PeopleList({ personId, kind }: { personId: number; kind: Kind }) {
    const [page, setPage] = useState(1);
    const [loaded, setLoaded] = useState<Loaded | null>(null);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const route = kind === 'followers' ? followers : following;

        fetch(route.url(personId, { query: { page } }), {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = (await response.json()) as PeoplePage;
                setLoaded((current) => ({
                    page,
                    people:
                        page > 1 && current
                            ? [...current.people, ...result.data]
                            : result.data,
                    more: result.links.next !== null,
                }));
                setFailed(false);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setFailed(true);
                }
            });

        return () => controller.abort();
    }, [personId, kind, page, attempt]);

    const people = loaded?.people ?? [];
    const loading = !failed && loaded?.page !== page;

    if (loading && people.length === 0) {
        return (
            <ul aria-hidden className="space-y-1 px-4 py-3 sm:px-5">
                {[0, 1, 2, 3].map((row) => (
                    <li key={row} className="flex items-center gap-3 py-2">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-2/5" />
                            <Skeleton className="h-3 w-3/5" />
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    if (failed && people.length === 0) {
        return (
            <LoadFailed
                onRetry={() => {
                    setFailed(false);
                    setAttempt((value) => value + 1);
                }}
            />
        );
    }

    if (people.length === 0) {
        return (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {kind === 'followers'
                    ? 'No followers yet.'
                    : 'Not following anyone yet.'}
            </p>
        );
    }

    return (
        <div aria-busy={loading}>
            <ul className="py-2">
                {people.map((person) => (
                    <li
                        key={person.id}
                        className="flex items-center gap-3 px-4 py-2 sm:px-5"
                    >
                        <PersonAvatar
                            name={person.name}
                            src={person.avatar}
                            className="size-10"
                        />
                        <span className="min-w-0 flex-1">
                            <PersonLink
                                person={person}
                                className="block truncate text-sm font-medium"
                            />
                            <span className="block truncate text-xs text-muted-foreground">
                                {person.affiliation}
                            </span>
                        </span>
                        {person.is_you && (
                            <span className="text-xs text-muted-foreground">
                                You
                            </span>
                        )}
                    </li>
                ))}
            </ul>
            {failed ? (
                <LoadFailed
                    onRetry={() => {
                        setFailed(false);
                        setAttempt((value) => value + 1);
                    }}
                />
            ) : (
                loaded?.more && (
                    <div className="px-4 pb-4 sm:px-5">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={() => setPage(page + 1)}
                            className="h-10 w-full rounded-[10px]"
                        >
                            {loading && <Spinner />}
                            {loading ? 'Loading…' : 'Show more'}
                        </Button>
                    </div>
                )
            )}
        </div>
    );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
                Could not load these people. Check your connection and try
                again.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Try again
            </Button>
        </div>
    );
}
