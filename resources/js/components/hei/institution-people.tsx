import { useId } from 'react';
import { PersonAvatar } from '@/components/person-avatar';

/**
 * A static preview of the names, to judge the card before it reads the
 * institution's real accounts. Replace with server data (the HEI's active
 * accounts, its GAD Focal Persons first) when it is approved.
 */
const preview = {
    focal: { name: 'Ana Reyes' },
    colleagues: [
        { name: 'Mark Villanueva' },
        { name: 'Joy Santos' },
        { name: 'Carlo Dela Cruz' },
        { name: 'Liza Mendoza' },
    ],
    total: 8,
};

/**
 * "People at your institution", like Facebook's Contacts column: the GAD
 * Focal Person first, as the one to ask about GAD work, then colleagues on
 * PHLGADIS. Only signed-in members of the same institution see it.
 */
export function InstitutionPeople() {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className="rounded-[10px] border bg-card"
        >
            <div className="flex items-center justify-between gap-2 px-4 pt-4">
                <h2 id={titleId} className="text-base font-medium">
                    People at your institution
                </h2>
                <span className="rounded-[6px] border px-1.5 py-0.5 text-xs leading-none text-muted-foreground">
                    Preview
                </span>
            </div>
            <p className="px-4 pt-1 text-xs text-muted-foreground">
                Sample names. Your colleagues will show here soon.
            </p>

            <div className="mx-2 mt-3 flex items-center gap-3 rounded-md bg-brand-soft/60 px-2 py-2.5">
                <PersonAvatar name={preview.focal.name} className="size-9" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                        {preview.focal.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-brand">
                            GAD Focal Person
                        </span>{' '}
                        · Ask about GAD reports and surveys
                    </p>
                </div>
            </div>

            <ul className="space-y-0.5 px-2 pt-1 pb-2">
                {preview.colleagues.map((person) => (
                    <li
                        key={person.name}
                        className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm"
                    >
                        <PersonAvatar name={person.name} />
                        <span className="min-w-0 flex-1 truncate">
                            {person.name}
                        </span>
                    </li>
                ))}
            </ul>

            <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                {preview.total} people from your institution are on PHLGADIS
            </p>
        </section>
    );
}
