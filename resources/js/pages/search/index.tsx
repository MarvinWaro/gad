import { Head, InfiniteScroll, router } from '@inertiajs/react';
import { CircleCheck, Search, SearchX } from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import { PersonAvatar } from '@/components/person-avatar';
import { FollowButton } from '@/components/people/follow-button';
import { PersonLink } from '@/components/people/person-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SEARCH_MIN_LENGTH } from '@/hooks/use-people-search';
import { search as searchPage } from '@/routes';
import type { ScrollPage } from '@/types';
import type { Person } from '@/types/people';

/** A result's outline while more load. */
function PersonSkeleton() {
    return (
        <div aria-hidden className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <Skeleton className="size-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
            </div>
        </div>
    );
}

/**
 * Everyone matching a search, best first (App\Support\PeopleSearch), each
 * with a link to their profile and a Follow button. More load as the
 * reader scrolls.
 */
export default function SearchResults({
    query,
    people,
}: {
    query: string;
    people: ScrollPage<Person>;
}) {
    const [text, setText] = useState(query);
    const list = useRef<HTMLUListElement>(null);
    const searched = query.trim().length >= SEARCH_MIN_LENGTH;

    return (
        <>
            <Head title={searched ? `${query} - Search` : 'Search'} />
            <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
                <Heading
                    title="Search"
                    description="Find people on PHLGADIS by name or institution."
                />
                <form
                    role="search"
                    aria-label="Search results"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(searchPage.url({ query: { q: text } }));
                    }}
                    className="flex gap-2"
                >
                    <div className="relative min-w-0 flex-1">
                        <Search
                            aria-hidden
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            type="search"
                            name="q"
                            aria-label="Search people"
                            placeholder="Name or institution"
                            autoComplete="off"
                            value={text}
                            onChange={(event) => setText(event.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" className="h-11">
                        Search
                    </Button>
                </form>

                {!searched ? (
                    <p className="text-sm text-muted-foreground">
                        Type at least two letters of a name or institution.
                        Capitals, accents and small spelling slips don’t matter.
                    </p>
                ) : people.data.length === 0 ? (
                    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <SearchX aria-hidden className="size-5" />
                        </span>
                        <p className="mt-4 font-medium">
                            No one found for “{query}”
                        </p>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Check the spelling, or try part of a name or the
                            institution’s name.
                        </p>
                    </div>
                ) : (
                    <section
                        aria-labelledby="people-results"
                        className="overflow-hidden rounded-xl border bg-card"
                    >
                        <h2
                            id="people-results"
                            className="border-b px-4 py-3 text-base font-medium sm:px-5"
                        >
                            People
                        </h2>
                        <InfiniteScroll
                            data="people"
                            preserveUrl
                            buffer={600}
                            itemsElement={list}
                            next={({ loading, hasMore }) =>
                                loading ? (
                                    <PersonSkeleton />
                                ) : (
                                    !hasMore && (
                                        <p className="flex items-center justify-center gap-2 border-t py-4 text-sm text-muted-foreground">
                                            <CircleCheck
                                                aria-hidden
                                                className="size-4"
                                            />
                                            That’s everyone
                                        </p>
                                    )
                                )
                            }
                        >
                            <ul ref={list} className="divide-y">
                                {people.data.map((person) => (
                                    <PersonRow
                                        key={person.id}
                                        person={person}
                                    />
                                ))}
                            </ul>
                        </InfiniteScroll>
                    </section>
                )}
            </div>
        </>
    );
}

function PersonRow({ person }: { person: Person }) {
    return (
        <li className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
            <PersonAvatar
                name={person.name}
                src={person.avatar}
                className="size-12"
            />
            <div className="min-w-0 flex-1">
                <PersonLink
                    person={person}
                    className="block truncate font-medium"
                />
                <p className="truncate text-sm text-muted-foreground">
                    {person.affiliation}
                </p>
                {person.follows_you && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Follows you
                    </p>
                )}
            </div>
            {person.is_you ? (
                <span className="text-sm text-muted-foreground">You</span>
            ) : (
                <FollowButton person={person} className="h-10" />
            )}
        </li>
    );
}

SearchResults.layout = {
    breadcrumbs: [{ title: 'Search', href: searchPage.url() }],
};
