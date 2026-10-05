import { useId } from 'react';
import { PersonAvatar } from '@/components/person-avatar';
import { PersonLink } from '@/components/people/person-link';
import { cn } from '@/lib/utils';
import type { InstitutionPeopleSummary } from '@/types';

/**
 * "People at your institution", like Facebook's Contacts column: the GAD
 * Focal Person first, as the one to ask about GAD work, then colleagues on
 * PHLGADIS (App\Support\InstitutionPeople). Only signed-in members of the
 * same institution see it.
 */
export function InstitutionPeople({
    summary,
}: {
    summary: InstitutionPeopleSummary;
}) {
    const titleId = useId();
    const focal = summary.people.filter((person) => person.focal);
    const colleagues = summary.people.filter((person) => !person.focal);

    return (
        <section
            aria-labelledby={titleId}
            className="rounded-[10px] border bg-card"
        >
            <h2 id={titleId} className="px-4 pt-4 text-base font-medium">
                People at your institution
            </h2>

            {summary.people.length === 0 ? (
                <p className="px-4 pt-1 pb-4 text-sm text-muted-foreground">
                    Colleagues from your institution appear here as they join
                    PHLGADIS.
                </p>
            ) : (
                <>
                    {focal.length > 0 && (
                        <ul
                            className={cn(
                                'mx-2 mt-3 space-y-1',
                                colleagues.length === 0 && 'mb-2',
                            )}
                        >
                            {focal.map((person) => (
                                <li
                                    key={person.id}
                                    className="flex items-center gap-3 rounded-md bg-brand-soft/60 px-2 py-2.5"
                                >
                                    <PersonAvatar
                                        name={person.name}
                                        src={person.avatar}
                                        className="size-9"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <PersonLink
                                            person={person}
                                            className="block truncate text-sm font-medium"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-medium text-brand">
                                                GAD Focal Person
                                            </span>{' '}
                                            · Ask about GAD reports and surveys
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    {colleagues.length > 0 && (
                        <ul
                            className={
                                focal.length > 0
                                    ? 'space-y-0.5 px-2 pt-1 pb-2'
                                    : 'space-y-0.5 px-2 pt-2 pb-2'
                            }
                        >
                            {colleagues.map((person) => (
                                <li
                                    key={person.id}
                                    className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                                >
                                    <PersonAvatar
                                        name={person.name}
                                        src={person.avatar}
                                    />
                                    <PersonLink
                                        person={person}
                                        className="min-w-0 flex-1 truncate"
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {summary.total > 1 && (
                <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                    {summary.total.toLocaleString()} people from your
                    institution are on PHLGADIS
                </p>
            )}
        </section>
    );
}
