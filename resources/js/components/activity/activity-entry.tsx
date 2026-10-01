import { Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    ChevronRight,
    Clock,
    Globe,
    MapPin,
    Monitor,
    Server,
    ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { PersonAvatar } from '@/components/person-avatar';
import { localDate, localDateTime } from '@/lib/manila-time';
import { placeLine } from '@/lib/places';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { ActivityEntry } from '@/types/activity';

/** Times inside changes come as ISO 8601 in UTC. */
const isoTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/**
 * One entry of the activity timeline: who, what, where and from which
 * device, with what changed folded away. With `onPerson`, naming the person
 * narrows the list to them.
 */
export function ActivityItem({
    entry,
    last,
    onPerson,
}: {
    entry: ActivityEntry;
    /** The last entry ends the rail. */
    last: boolean;
    /** Without it (a person's own activity) the name is plain text. */
    onPerson?: (id: number) => void;
}) {
    const tone = tones[entry.action.tone];
    const { actor, sentence, subject } = entry;
    const actorId = actor.id;
    const place = [
        entry.place.hei,
        placeLine(entry.place.cluster, entry.place.region),
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <li className="relative flex gap-3 pb-4 sm:gap-4">
            {!last && (
                <span
                    aria-hidden
                    className="absolute top-11 bottom-0 left-[1.125rem] w-px bg-border"
                />
            )}
            <ActorMark entry={entry} />
            <article
                className={cn(
                    'min-w-0 flex-1 rounded-xl border border-l-[3px] bg-card p-4',
                    tone.edge,
                )}
            >
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        {actorId !== null && onPerson ? (
                            <button
                                type="button"
                                onClick={() => onPerson(actorId)}
                                aria-label={`Show only the activity of ${actor.name}`}
                                className="rounded-sm font-medium break-all outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {actor.name}
                            </button>
                        ) : (
                            <span className="font-medium break-all">
                                {actor.name}
                            </span>
                        )}
                        <span
                            className={cn(
                                'rounded-md px-2 py-0.5 text-xs font-medium',
                                tone.badge,
                            )}
                        >
                            {entry.action.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            in {entry.module.label}
                        </span>
                    </p>
                    {subject.url && (
                        <Link
                            href={subject.url}
                            className="-my-1 inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ArrowUpRight aria-hidden className="size-3.5" />
                            View
                            {sentence.subject && (
                                <span className="sr-only">
                                    {' '}
                                    {sentence.subject}
                                </span>
                            )}
                        </Link>
                    )}
                </div>

                <p className="mt-1.5 text-sm break-words">
                    {sentence.before}
                    {sentence.subject && (
                        <>
                            {' '}
                            <span className="font-medium">
                                {sentence.subject}
                            </span>
                        </>
                    )}
                    {sentence.after && ` ${sentence.after}`}
                </p>

                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <Meta icon={Clock}>
                        <time dateTime={entry.created_at}>
                            {localDateTime(entry.created_at)}
                        </time>
                    </Meta>
                    {place && <Meta icon={MapPin}>{place}</Meta>}
                    {entry.device && <Meta icon={Monitor}>{entry.device}</Meta>}
                    {entry.ip_address && (
                        <Meta icon={Globe}>
                            <span className="sr-only">IP address </span>
                            <span className="tabular-nums">
                                {entry.ip_address}
                            </span>
                        </Meta>
                    )}
                </ul>

                {(entry.changes.length > 0 || entry.details.length > 0) && (
                    <EntryDetails entry={entry} />
                )}
            </article>
        </li>
    );
}

/** The person's photo, or a mark for a failed login or the system. */
function ActorMark({ entry }: { entry: ActivityEntry }) {
    if (entry.actor.id !== null) {
        return (
            <PersonAvatar
                name={entry.actor.name}
                src={entry.actor.avatar}
                className="relative size-9"
                fallbackClassName="text-xs"
            />
        );
    }

    const Icon = entry.action.code === 'login_failed' ? ShieldAlert : Server;

    return (
        <span
            aria-hidden
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
            <Icon className="size-4" />
        </span>
    );
}

function Meta({
    icon: Icon,
    children,
}: {
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <li className="inline-flex min-w-0 items-center gap-1.5">
            <Icon aria-hidden className="size-3.5 shrink-0" />
            <span className="min-w-0 break-words">{children}</span>
        </li>
    );
}

/** What changed, field by field, and anything else the entry kept. */
function EntryDetails({ entry }: { entry: ActivityEntry }) {
    return (
        <details className="group mt-3">
            <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-md text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <ChevronRight
                    aria-hidden
                    className="size-3.5 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                />
                {entry.changes.length > 0
                    ? `View changes (${entry.changes.length})`
                    : 'View details'}
            </summary>
            {entry.changes.length > 0 && (
                <table className="mt-2 w-full table-fixed text-left text-xs">
                    <caption className="sr-only">Changes</caption>
                    <thead className="text-muted-foreground">
                        <tr>
                            <th
                                scope="col"
                                className="w-1/4 py-1.5 pr-3 font-medium"
                            >
                                Field
                            </th>
                            <th scope="col" className="py-1.5 pr-3 font-medium">
                                Before
                            </th>
                            <th scope="col" className="py-1.5 font-medium">
                                After
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y border-t">
                        {entry.changes.map((change) => (
                            <tr key={change.field} className="align-top">
                                <th
                                    scope="row"
                                    className="py-1.5 pr-3 font-medium break-words"
                                >
                                    {change.field}
                                </th>
                                <td className="py-1.5 pr-3 break-words text-muted-foreground">
                                    <Value value={change.before} />
                                </td>
                                <td className="py-1.5 break-words">
                                    <Value value={change.after} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {entry.details.length > 0 && (
                <dl className="mt-2 grid gap-x-4 gap-y-1 border-t pt-2 text-xs sm:grid-cols-[10rem_1fr]">
                    {entry.details.map((detail) => (
                        <div key={detail.label} className="contents">
                            <dt className="font-medium">{detail.label}</dt>
                            <dd className="mb-1 break-words text-muted-foreground sm:mb-0">
                                <Value value={detail.value} />
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
        </details>
    );
}

function Value({ value }: { value: string | null }) {
    if (value === null) {
        return (
            <>
                <span aria-hidden>—</span>
                <span className="sr-only">empty</span>
            </>
        );
    }

    return <>{isoTime.test(value) ? localDate(value) : value}</>;
}
